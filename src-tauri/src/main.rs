// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod channel;
use channel::Channel;
use tauri::{State, Manager};
use std::sync::{Arc, Mutex};
use serde_json::Value;

struct ChannelState {
    channel: Arc<Mutex<Channel>>,
}

#[tauri::command]
fn emit_event(state: State<'_, ChannelState>, event: String, data: Value, skip_encryption: bool) -> Result<(), String> {
    let channel = state.channel.lock().map_err(|e| e.to_string())?;
    channel.emit(&event, data, skip_encryption).map_err(|e| e.to_string())
}

#[tauri::command]
fn disconnect_channel(state: State<'_, ChannelState>) -> Result<(), String> {
    let channel = state.channel.lock().map_err(|e| e.to_string())?;
    channel.disconnect().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_channel_secret(state: State<'_, ChannelState>) -> Result<String, String> {
    let channel = state.channel.lock().map_err(|e| e.to_string())?;
    Ok(channel.encryption_key.clone().unwrap_or_default())
}

#[tauri::command]
fn generate_encryption_key(state: State<'_, ChannelState>) -> Result<String, String> {
    let mut channel = state.channel.lock().map_err(|e| e.to_string())?;
    channel.generate_encryption_key().map_err(|e| e.to_string())
}

fn main() {
    env_logger::init();
    tauri::Builder::default()
        .setup(|app| {
            let channel = Channel::new(app.handle());
            let channel_state = ChannelState {
                channel: Arc::new(Mutex::new(channel)),
            };
            app.manage(channel_state);
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