// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
use channel::Channel;
use tauri::{State, Manager};
use std::sync::Mutex;
use serde_json::Value;
use std::path::Path;

mod hwi;
use hwi::interface::HWIClient;
use hwi::types::HWIDevice;

struct AppStateInner {
    channel: Channel,
    hwi: Option<HWIClient>,
}

type AppState = Mutex<AppStateInner>;


// ==================== Channel Commands ====================

#[tauri::command]
fn emit_event(state: State<'_, AppState>, event: String, data: Value, skip_encryption: bool) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.channel.emit(&event, data, skip_encryption).map_err(|e| e.to_string())
}

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
    state.channel.generate_encryption_key().map_err(|e| e.to_string())
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
    state.hwi.as_ref()
        .ok_or("HWI client not available".to_string())?
        .enumerate()
        // TODO: handle devices with error
        .map(|devices| devices.into_iter().filter_map(Result::ok).collect())
        .map_err(|e| e.to_string())
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let channel = Channel::new(app.handle());
            // TODO: For Linux we might need to install udev rules here or with a command for the interface.
            let hwi = get_hwi(app.handle());
            let app_state = AppStateInner {
                channel,
                hwi
            };
            app.manage(Mutex::new(app_state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            emit_event,
            disconnect_channel,
            get_channel_secret,
            generate_encryption_key,
            is_hwi_available,
            hwi_enumerate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn get_hwi(app_handle: tauri::AppHandle) -> Option<HWIClient> {
    let hwi_binary_name = HWIClient::get_hwi_binary_name();
    let hwi_path = app_handle.path_resolver()
        .resolve_resource(Path::new("resources/").join(hwi_binary_name))
        .ok_or_else(|| format!("Failed to resolve HWI binary path for {}", hwi_binary_name));

    if let Err(e) = hwi_path {
        log::error!("Failed to initialize HWI: {}", e);
        return None;
    }

    Some(HWIClient::new(hwi_path.unwrap(), true)) // TODO: set test mode by env var and disabled by default
}