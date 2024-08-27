use serde_json::value::Value;
use std::convert::TryInto;
use bitcoin::bip32::DerivationPath;
use bitcoin::Network;
use tauri::api::process::Command;

use crate::hwi::error::Error;
use crate::hwi::types::{HWIDevice, HWIDeviceInternal, HWIExtendedPubKey};

macro_rules! deserialize_obj {
    ( $e: expr ) => {{
        let value: Value = serde_json::from_str($e)?;
        let obj = value.clone();
        serde_json::from_value(value)
            .map_err(|e| Error::Hwi(format!("error {} while deserializing {}", e, obj), None))
    }};
}

pub struct HWIClient {
    test_mode: bool,
    pub device_fingerprint: Option<String>,
    pub device_type: Option<String>,
    pub network: Network,
}

impl HWIClient {
    pub fn new(test_mode: bool) -> Self {
        HWIClient {
            test_mode,
            device_fingerprint: None,
            device_type: None,
            network: Network::Bitcoin,
        }
    }

    pub fn set_device_info(&mut self, fingerprint: String, device_type: String) {
        self.device_fingerprint = Some(fingerprint);
        self.device_type = Some(device_type);
    }

    pub fn set_network(&mut self, network: &str) {
        match network {
            "mainnet" | "MAINNET" => self.network = Network::Bitcoin,
            "testnet" | "TESTNET" => self.network = Network::Testnet,
            _ => log::warn!("Unsupported network: {}", network),
        }
    }

    fn run_hwi_command(&self, args: Vec<&str>) -> Result<String, Error> {
        let mut command_args = Vec::new();
        
        if args[0] != "enumerate" {
            let fingerprint = self.device_fingerprint.clone().ok_or(Error::Hwi(
                "Device fingerprint not set".to_string(),
                None,
            ))?;
            command_args.push("--fingerprint".to_string());
            command_args.push(fingerprint);
        }
        
        if self.test_mode {
            command_args.insert(0, "--emulators".to_string());
        }

        command_args.extend(args.into_iter().map(|s| s.to_string()));
        
        let output = Command::new_sidecar("hwi")
            .map_err(|e| Error::Hwi(format!("Failed to create sidecar command: {}", e), None))?
            .args(command_args)
            .output()
            .map_err(|e| Error::Hwi(format!("Failed to execute HWI command: {}", e), None))?;

        if output.status.success() {
            Ok(output.stdout)
        } else {
            Err(Error::Hwi(output.stderr, None))
        }
    }

    pub fn enumerate(&self) -> Result<Vec<Result<HWIDevice, Error>>, Error> {
        let output = self.run_hwi_command(vec!["enumerate"])?;
        let devices_internal: Vec<HWIDeviceInternal> = deserialize_obj!(&output)?;
        Ok(devices_internal.into_iter().map(|d| d.try_into()).collect())
    }

    pub fn get_xpub(
        &self,
        path: &DerivationPath,
        expert: bool,
    ) -> Result<HWIExtendedPubKey, Error> {
        let prefixed_path = format!("m/{}", path);
        let mut args = vec!["getxpub", &prefixed_path];
        if expert {
            args.push("--expert");
        }
        let output = self.run_hwi_command(args)?;
        deserialize_obj!(&output)
    }
}
