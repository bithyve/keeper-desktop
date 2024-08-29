// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
mod device;
mod hwi;
use channel::Channel;
use device::get_xpub;
use hwi::interface::HWIClient;
use hwi::implementations::binary_implementation::BinaryHWIImplementation;
use hwi::types::{HWIBinaryExecutor, HWIDevice, HWIDeviceType};
use hwi::error::Error;
use serde_json::Value;
use std::str::FromStr;
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri::api::process::Command;
use serde_json::json;

pub struct HWIClientState {
    hwi: HWIClient<BinaryHWIImplementation<HWIBinaryExecutorImpl>>,
    device_type: HWIDeviceType,
    fingerprint: String,
    network: bitcoin::Network,
}

struct AppStateInner {
    channel: Channel,
    hwi: Option<HWIClientState>,
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
async fn hwi_enumerate(_: State<'_, AppState>) -> Result<Vec<HWIDevice>, String> {
    HWIClient::<BinaryHWIImplementation<HWIBinaryExecutorImpl>>::enumerate()
        // TODO: handle devices with error
        .map(|devices| devices.into_iter().filter_map(Result::ok).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_hwi_client(
    state: State<'_, AppState>,
    fingerprint: String,
    device_type: HWIDeviceType,
    network: bitcoin::Network,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    let client = HWIClient::<BinaryHWIImplementation<HWIBinaryExecutorImpl>>::find_device(
        None,
        Some(device_type.clone()),
        Some(&fingerprint),
        false,
        network,
    ).map_err(|e| e.to_string())?;
    state.hwi = Some(HWIClientState {
        hwi: client,
        device_type,
        fingerprint,
        network,
    });
    Ok(())
}

#[tauri::command]
fn share_xpubs(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let mut xpub_data = get_xpub(&hwi_state).map_err(|e| e.to_string())?;
    xpub_data["action"] = Value::from("ADD_DEVICE");
    let event_data = json!({
        "event": "CHANNEL_MESSAGE",
        "data": [
            {
                "responseData": xpub_data
            }
        ]
    });

    state.channel
        .emit("CHANNEL_MESSAGE", event_data, false)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn device_healthcheck(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let mut xpub_data = get_xpub(&hwi_state).map_err(|e| e.to_string())?;
    xpub_data["action"] = Value::from("HEALTH_CHECK");
    let event_data = json!({
        "event": "CHANNEL_MESSAGE",
        "data": [
            {
                "responseData": xpub_data
            }
        ]
    });
    
    state.channel
        .emit("CHANNEL_MESSAGE", event_data, false)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn sign_tx(state: State<'_, AppState>, psbt: String) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let signed_psbt = hwi_state.hwi.sign_tx(&bitcoin::Psbt::from_str(&psbt).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let event_data = json!({
        "event": "CHANNEL_MESSAGE",
        "data": [
            {
                "responseData": {
                    "action": "SIGN_TX",
                    "signedSerializedPSBT": signed_psbt
                }
            }
        ]
    });
    
    state.channel
        .emit("CHANNEL_MESSAGE", event_data, false)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn register_multisig(state: State<'_, AppState>, descriptor: String) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let address = hwi_state.hwi.display_address_with_desc(&descriptor).map_err(|e| e.to_string())?;
    let event_data = json!({
        "event": "CHANNEL_MESSAGE",
        "data": [
            {
                "responseData": {
                    "action": "REGISTER_MULTISIG",
                    "address": address
                }
            }
        ]
    });
    
    state.channel
        .emit("CHANNEL_MESSAGE", event_data, false)
        .map_err(|e| e.to_string())
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
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
                        // TODO: Handle events as needed
                        _ => (),
                    }
                }
            });
            let channel = Channel::new(app.handle());
            // TODO: For Linux we might need to install udev rules here or with a command for the interface.
            let app_state = AppStateInner { channel, hwi: None };
            app.manage(Mutex::new(app_state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            disconnect_channel,
            get_channel_secret,
            generate_encryption_key,
            hwi_enumerate,
            set_hwi_client,
            share_xpubs,
            device_healthcheck,
            sign_tx,
            register_multisig
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub struct HWIBinaryExecutorImpl;

impl HWIBinaryExecutor for HWIBinaryExecutorImpl {
    fn execute_command(args: Vec<String>) -> Result<String, Error> {
        let output = Command::new_sidecar("hwi")
            .map_err(|e| Error::Hwi(format!("Failed to create sidecar command: {}", e), None))?
            .args(args)
            .output()
            .map_err(|e| Error::Hwi(format!("Failed to execute command: {}", e), None))?;

        if output.status.success() {
            Ok(output.stdout)
        } else {
            Err(Error::Hwi(output.stderr, None))
        }
    }
}