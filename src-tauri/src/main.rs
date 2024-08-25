// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
use channel::Channel;
use tauri::{State, Manager};
use std::sync::Mutex;
use serde_json::Value;

struct AppStateInner {
    channel: Channel,
}

type AppState = Mutex<AppStateInner>;

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

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let channel = Channel::new(app.handle());
            let app_state = AppStateInner {
                channel: channel,
            };
            app.manage(Mutex::new(app_state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            emit_event,
            disconnect_channel,
            get_channel_secret,
            generate_encryption_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}