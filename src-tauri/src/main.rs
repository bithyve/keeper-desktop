// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
mod device;
mod hwi;
use bitcoin::Network;
use channel::Channel;
use device::get_xpub;
use hwi::interface::HWIClient;
use hwi::types::HWIDevice;
use log::info;
use serde_json::Value;
use std::path::Path;
use std::sync::Mutex;
use tauri::{Manager, State};
struct AppStateInner {
    channel: Channel,
    hwi: Option<HWIClient>,
}

type AppState = Mutex<AppStateInner>;

// ==================== Channel Commands ====================

#[tauri::command]
fn disconnect_channel(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.channel.disconnect().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_channel_secret(state: State<'_, AppState>) -> Result<String, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.channel.encryption_key.clone().unwrap_or_default())
}

#[tauri::command]
fn generate_encryption_key(state: State<'_, AppState>) -> Result<String, String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state
        .channel
        .generate_encryption_key()
        .map_err(|e| e.to_string())
}

// ==================== HWI Commands ====================

#[tauri::command]
fn is_hwi_available(state: State<'_, AppState>) -> Result<bool, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.hwi.is_some())
}

#[tauri::command]
async fn hwi_enumerate(state: State<'_, AppState>) -> Result<Vec<HWIDevice>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state
        .hwi
        .as_ref()
        .ok_or("HWI client not available".to_string())?
        .enumerate()
        // TODO: handle devices with error
        .map(|devices| devices.into_iter().filter_map(Result::ok).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_device_info(
    state: State<'_, AppState>,
    fingerprint: String,
    device_type: String,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    let hwi = state
        .hwi
        .as_mut()
        .ok_or("HWI client not available".to_string())?;
    hwi.set_device_info(fingerprint, device_type);
    Ok(())
}

#[tauri::command]
fn share_xpubs(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi = state
        .hwi
        .as_ref()
        .ok_or("HWI client not available".to_string())?;
    let xpub_data = get_xpub(hwi, hwi.network).map_err(|e| e.to_string())?;
    let device_type = hwi.device_type.as_ref().unwrap().as_str();
    emit_device_operation(&state.channel, "SETUP", device_type, xpub_data)
}

#[tauri::command]
fn device_healthcheck(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi = state
        .hwi
        .as_ref()
        .ok_or("HWI client not available".to_string())?;
    let xpub_data = get_xpub(hwi, hwi.network).map_err(|e| e.to_string())?;
    let device_type = hwi.device_type.as_ref().unwrap().as_str();
    emit_device_operation(&state.channel, "HEALTHCHECK", device_type, xpub_data)
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let channel_handle = app_handle.clone();
            app_handle.listen_global("channel-message", move |event| {
                if let Some(payload) = event.payload() {
                    let message: serde_json::Value = match serde_json::from_str(payload) {
                        Ok(m) => m,
                        Err(_) => return,
                    };

                    let event_name = match message.get("event").and_then(|e| e.as_str()) {
                        Some(e) => e,
                        None => return,
                    };

                    match event_name {
                        "SET_NETWORK" => {
                            let network = message
                                .get("data")
                                .and_then(|d| d.as_array())
                                .and_then(|arr| arr.first())
                                .and_then(|elem| elem.get("network"))
                                .and_then(|n| n.as_str());

                            if let Some(network) = network {
                                if let Ok(mut state) = channel_handle.state::<AppState>().try_lock() {
                                    if let Some(hwi) = &mut state.hwi {
                                        hwi.set_network(network);
                                    } else {
                                        log::warn!("HWI client not available");
                                    }
                                } else {
                                    log::error!("Failed to acquire lock on AppState");
                                }
                            }
                        }
                        _ => (),
                    }
                }
            });
            let channel = Channel::new(app.handle());
            // TODO: For Linux we might need to install udev rules here or with a command for the interface.
            let hwi = get_hwi(app.handle());
            let app_state = AppStateInner { channel, hwi };
            app.manage(Mutex::new(app_state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            disconnect_channel,
            get_channel_secret,
            generate_encryption_key,
            is_hwi_available,
            hwi_enumerate,
            set_device_info,
            share_xpubs,
            device_healthcheck,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_hwi(app_handle: tauri::AppHandle) -> Option<HWIClient> {
    let hwi_binary_name = HWIClient::get_hwi_binary_name();
    let hwi_path = app_handle
        .path_resolver()
        .resolve_resource(Path::new("resources/").join(hwi_binary_name))
        .ok_or_else(|| format!("Failed to resolve HWI binary path for {}", hwi_binary_name));

    if let Err(e) = hwi_path {
        log::error!("Failed to initialize HWI: {}", e);
        return None;
    }

    Some(HWIClient::new(hwi_path.unwrap(), true)) // TODO: set test mode by env var and disabled by default
}

fn emit_device_operation(
    channel: &Channel,
    operation_type: &str,
    device_type: &str,
    xpub_data: Value,
) -> Result<(), String> {
    let event_name = match device_type {
        "trezor" => format!("TREZOR_{}", operation_type),
        "ledger" => format!("LEDGER_{}", operation_type),
        "bitbox02" => format!("BITBOX_{}", operation_type),
        "coldcard" => format!("LEDGER_{}", operation_type), // FOR TESTING
        _ => return Err(format!("Unsupported device type: {}", device_type)),
    };

    channel
        .emit(&event_name, xpub_data, false)
        .map_err(|e| e.to_string())
}
