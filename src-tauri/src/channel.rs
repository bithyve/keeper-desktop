use rust_socketio::{ClientBuilder, Payload, Event};
use rust_socketio::client::Client;
use serde_json::json;
use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use tauri::Manager;
use sha2::{Sha256, Digest};
use rand::Rng;
use hex;
use log::{info, error, warn};
use thiserror::Error;
use std::ops::Drop;

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

const URL: &str = "https://keeper-channel.herokuapp.com/";

#[derive(Error, Debug)]
pub enum ChannelError {
    #[error("No client available")]
    NoClient,
    #[error("No room set")]
    NoRoom,
    #[error("No encryption key set")]
    NoEncryptionKey,
    #[error("Invalid IV")]
    InvalidIV,
    #[error("Invalid encrypted data")]
    InvalidEncryptedData,
    #[error("Encryption error: {0}")]
    EncryptionError(String),
    #[error("Decryption error: {0}")]
    DecryptionError(String),
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Hex decoding error: {0}")]
    HexError(#[from] hex::FromHexError),
    #[error("UTF-8 conversion error: {0}")]
    Utf8Error(#[from] std::string::FromUtf8Error),
    #[error("Socket.IO error: {0}")]
    SocketIoError(String),
}

pub struct Channel {
    pub client: Option<Client>,
    pub room: Option<String>,
    pub encryption_key: Option<String>,
}

impl Channel {
    /// Creates a new Channel instance with a connected Socket.IO client
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        let client = ClientBuilder::new(URL)
            .on(Event::Connect, |_, _| {
                info!("Channel connected");
            })
            .on(Event::Error, |err, _| {
                error!("Channel error: {:#?}", err);
            }).on_any({
                move |event, payload, _| {
                    match payload {
                        #[allow(deprecated)]
                        Payload::String(str) => warn!("Received unexpected string: {}", str),
                        Payload::Text(text) => {
                            info!("Channel received event: {:?} with message: {:?}", event.as_str(), text);
                            if event.as_str() == "CHANNEL_MESSAGE" {
                                if let Ok(state) = app_handle.state::<crate::AppState>().try_lock() {
                                    let text = serde_json::to_value(text).map_err(|_| "Failed to parse message as JSON");
                                    if let Ok(text) = text {
                                        match state.channel.process_channel_message(&text) {
                                            Ok(processed_data) => {
                                                if let Err(e) = app_handle.emit_all("channel-message", processed_data) {
                                                    error!("Failed to emit channel-message event: {:?}, got error: {:?}", text, e);
                                                }
                                            },
                                            Err(e) => error!("Error processing message: {}", e),
                                        }
                                    } else {
                                        error!("Error converting text to JSON: {}", text.err().unwrap());
                                    }
                                }
                            }
                        },
                        Payload::Binary(bin_data) => warn!("Received unexpected bytes: {:#?}", bin_data),
                    }
                }
            })
            .connect();
        
        Channel {
            client: client.ok(),
            room: None,
            encryption_key: None,
        }
    }

    /// Disconnects the Socket.IO client
    pub fn disconnect(&self) -> Result<(), ChannelError> {
        if let Some(client) = &self.client {
            client.disconnect().map_err(|e| ChannelError::SocketIoError(e.to_string()))?;
        }
        Ok(())
    }

    /// Emits an event with data to the current room
    /// 
    /// If `skip_encryption` is false, the data will be encrypted before sending
    pub fn emit(&self, event: &str, data: serde_json::Value, skip_encryption: bool, network: Option<&str>) -> Result<(), ChannelError> {
        let encrypted = if !skip_encryption {
            self.encrypt_data(data)?
        } else {
            serde_json::to_value(data.to_string())?
        };

        if let Some(room) = &self.room {
            if let Some(client) = &self.client {
                let mut data = json!({"room": room, "data": encrypted});
                if let Some(network) = network {
                    data["network"] = serde_json::Value::String(network.to_string());
                }
                client.emit(event, data)
                    .map_err(|e| ChannelError::SocketIoError(e.to_string()))?;
                Ok(())
            } else {
                Err(ChannelError::NoClient)
            }
        } else {
            Err(ChannelError::NoRoom)
        }
    }

    /// Generates a new encryption key and joins a new room
    /// 
    /// Returns the generated encryption key
    pub fn generate_encryption_key(&mut self) -> Result<String, ChannelError> {
        let random_bytes: [u8; 32] = rand::thread_rng().gen();
        let key = hex::encode(random_bytes);
        let room = hex::encode(Sha256::digest(&key));
        self.encryption_key = Some(key.clone());
        self.room = Some(room.clone());
        
        self.emit("JOIN_CHANNEL", json!({"room": room}), true, None)?;
        
        Ok(key)
    }

    /// Encrypts the provided data using AES-256-CBC
    /// 
    /// Returns a JSON object containing the IV and encrypted data
    fn encrypt_data(&self, data: serde_json::Value) -> Result<serde_json::Value, ChannelError> {
        let encryption_key = self.encryption_key.as_ref().ok_or(ChannelError::NoEncryptionKey)?;
        let key_bytes = hex::decode(encryption_key)?;

        let mut iv = [0u8; 16];
        rand::thread_rng().fill(&mut iv);

        let cipher = Aes256Cbc::new_from_slices(&key_bytes, &iv)
            .map_err(|e| ChannelError::EncryptionError(e.to_string()))?;

        let encrypted_data = cipher.encrypt_vec(data.to_string().as_bytes());

        Ok(json!({
            "iv": hex::encode(iv),
            "encryptedData": hex::encode(encrypted_data)
        }))
    }

    /// Decrypts the provided encrypted data
    /// 
    /// Expects a JSON object containing the IV and encrypted data
    pub fn decrypt_data(&self, encrypted: &serde_json::Value) -> Result<serde_json::Value, ChannelError> {
        let encryption_key = self.encryption_key.as_ref().ok_or(ChannelError::NoEncryptionKey)?;
        let key_bytes = hex::decode(encryption_key)?;

        let iv = hex::decode(encrypted["iv"].as_str().ok_or(ChannelError::InvalidIV)?)?;
        let encrypted_data = hex::decode(encrypted["encryptedData"].as_str().ok_or(ChannelError::InvalidEncryptedData)?)?;

        let cipher = Aes256Cbc::new_from_slices(&key_bytes, &iv)
            .map_err(|e| ChannelError::DecryptionError(e.to_string()))?;

        let decrypted_data = cipher.decrypt_vec(&encrypted_data)
            .map_err(|e| ChannelError::DecryptionError(e.to_string()))?;

        let decrypted_string = String::from_utf8(decrypted_data)?;

        serde_json::from_str(&decrypted_string).map_err(ChannelError::from)
    }

    pub fn process_channel_message(&self, message: &serde_json::Value) -> Result<serde_json::Value, String> {
        let data = message.as_array().and_then(|arr| arr.first()).ok_or("Failed to parse message")?;

        let request_data = data.get("requestData").ok_or("Failed to parse message data")?;

        let network = data.get("network").ok_or("Failed to parse message network")?;

        let data = if request_data.get("encryptedData").is_some() {
            self.decrypt_data(request_data)
                .map_err(|_| "Failed to decrypt message from channel")?
        } else {
            request_data.clone()
        };

        Ok(json!({ "data": data, "network": network }))
    }
}

impl Drop for Channel {
    fn drop(&mut self) {
        if let Err(e) = self.disconnect() {
            error!("Error disconnecting channel on drop: {}", e);
        }
    }
}