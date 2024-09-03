// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
mod device;
mod hwi;
use bitcoin::base64::{engine::general_purpose, Engine as _};
use bitcoin::Address;
use channel::Channel;
use device::get_xpub;
use hwi::error::Error;
use hwi::implementations::binary_implementation::BinaryHWIImplementation;
use hwi::interface::HWIClient;
use hwi::types::{HWIBinaryExecutor, HWIDevice, HWIDeviceType};
use serde_json::{json, Value};
use std::str::FromStr;
use tauri::api::process::Command;
use tauri::{Manager, State};
use tokio::sync::Mutex;

pub struct HWIClientState {
    hwi: HWIClient<BinaryHWIImplementation<HWIBinaryExecutorImpl>>,
    #[allow(dead_code)]
    device_type: HWIDeviceType,
    fingerprint: String,
    network: bitcoin::Network,
}

pub struct AppStateInner {
    channel: Channel,
    hwi: Option<HWIClientState>,
}

pub type AppState = Mutex<AppStateInner>;

// ==================== Channel Commands ====================

#[tauri::command]
async fn connect_channel(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut state = state.lock().await;
    if state.channel.client.is_none() {
        let new_channel = Channel::new(app_handle, 30).await;
        if new_channel.client.is_some() {
            state.channel = new_channel;
            Ok(true)
        } else {
            Err("Failed to reconnect channel".to_string())
        }
    } else {
        Ok(true)
    }
}

#[tauri::command]
fn check_client_status(state: State<'_, AppState>) -> Result<bool, String> {
    let state = state.try_lock().map_err(|e| e.to_string())?;
    Ok(state.channel.client.is_some())
}

#[tauri::command]
fn disconnect_channel(state: State<'_, AppState>) -> Result<(), String> {
    let state = state.try_lock().map_err(|e| e.to_string())?;
    state.channel.disconnect().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_channel_secret(state: State<'_, AppState>) -> Result<String, String> {
    let state = state.try_lock().map_err(|e| e.to_string())?;
    Ok(state.channel.encryption_key.clone().unwrap_or_default())
}

#[tauri::command]
fn generate_encryption_key(state: State<'_, AppState>) -> Result<String, String> {
    let mut state = state.try_lock().map_err(|e| e.to_string())?;
    state
        .channel
        .generate_encryption_key()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn emit_to_channel(state: State<'_, AppState>, event_data: Value) -> Result<(), String> {
    let state = state.try_lock().map_err(|e| e.to_string())?;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    state
        .channel
        .emit(
            "CHANNEL_MESSAGE",
            event_data,
            false,
            Some(&hwi_state.network.to_string()),
        )
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
    let mut state = state.try_lock().map_err(|e| e.to_string())?;
    let client = HWIClient::<BinaryHWIImplementation<HWIBinaryExecutorImpl>>::find_device(
        None,
        Some(device_type.clone()),
        Some(&fingerprint),
        false,
        network,
    )
    .map_err(|e| e.to_string())?;
    state.hwi = Some(HWIClientState {
        hwi: client,
        device_type,
        fingerprint,
        network,
    });
    Ok(())
}

#[tauri::command]
async fn hwi_get_xpubs(state: State<'_, AppState>) -> Result<Value, String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let xpub_data = get_xpub(hwi_state).map_err(|e| e.to_string())?;

    Ok(json!({
        "event": "CHANNEL_MESSAGE",
        "data": {
            "responseData": {
                "action": "ADD_DEVICE",
                "data": xpub_data
            }
        }
    }))
}

#[tauri::command]
async fn hwi_healthcheck(state: State<'_, AppState>) -> Result<Value, String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let xpub_data = get_xpub(hwi_state).map_err(|e| e.to_string())?;

    Ok(json!({
        "event": "CHANNEL_MESSAGE",
        "data": {
            "responseData": {
                "action": "HEALTH_CHECK",
                "data": xpub_data
            }
        }
    }))
}

#[tauri::command]
async fn hwi_sign_tx(state: State<'_, AppState>, psbt: String) -> Result<Value, String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let signed_psbt = hwi_state
        .hwi
        .sign_tx(&bitcoin::Psbt::from_str(&psbt).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    Ok(json!({
        "event": "CHANNEL_MESSAGE",
        "data": {
            "responseData": {
                "action": "SIGN_TX",
                "data": {
                    "signedSerializedPSBT": general_purpose::STANDARD.encode(signed_psbt.serialize())
                }
            }
        }
    }))
}

#[tauri::command]
async fn hwi_register_multisig(
    state: State<'_, AppState>,
    descriptor: String,
    expected_address: String,
) -> Result<Value, String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let address = hwi_state
        .hwi
        .display_address_with_desc(&descriptor)
        .map_err(|e| e.to_string())?;
    if address.address != Address::from_str(&expected_address).map_err(|e| e.to_string())? {
        return Err("Address received from device does not match the expected address".to_string());
    }
    Ok(json!({
        "event": "CHANNEL_MESSAGE",
        "data": {
            "responseData": {
                "action": "REGISTER_MULTISIG",
                "data": {
                    "address": address.address
                }
            }
        }
    }))
}

#[tauri::command]
async fn hwi_verify_address(
    state: State<'_, AppState>,
    descriptor: String,
    expected_address: String,
) -> Result<Value, String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    let address = hwi_state
        .hwi
        .display_address_with_desc(&descriptor)
        .map_err(|e| e.to_string())?;
    if address.address != Address::from_str(&expected_address).map_err(|e| e.to_string())? {
        return Err("Address received from device does not match the expected address".to_string());
    }
    Ok(json!({
        "event": "CHANNEL_MESSAGE",
        "data": {
            "responseData": {
                "action": "VERIFY_ADDRESS",
                "data": {
                    "address": address.address
                }
            }
        }
    }))
}

#[tauri::command]
async fn hwi_send_pin(state: State<'_, AppState>, pin: String) -> Result<(), String> {
    let state = state.lock().await;
    let hwi_state = state.hwi.as_ref().ok_or("HWI client not initialized")?;
    hwi_state.hwi.send_pin(&pin).map_err(|e| e.to_string())
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            // TODO: For Linux we might need to install udev rules here or with a command for the interface.
            let app_state = AppStateInner {
                channel: Channel::new_empty(),
                hwi: None,
            };
            app.manage(Mutex::new(app_state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connect_channel,
            check_client_status,
            disconnect_channel,
            get_channel_secret,
            generate_encryption_key,
            hwi_enumerate,
            set_hwi_client,
            hwi_get_xpubs,
            hwi_healthcheck,
            hwi_sign_tx,
            hwi_register_multisig,
            hwi_verify_address,
            emit_to_channel,
            hwi_send_pin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub struct HWIBinaryExecutorImpl;

impl HWIBinaryExecutor for HWIBinaryExecutorImpl {
    fn execute_command(args: Vec<String>) -> Result<String, Error> {
        let mut args = args;
        // TODO: Downgrade binaries to HWI 2.x and remove this flag
        args.insert(0, "--emulators".to_string());

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
