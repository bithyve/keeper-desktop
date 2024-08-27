use serde_json::value::Value;
use std::convert::TryInto;
use std::env;
use std::path::PathBuf;
use std::process::Command;
use bitcoin::bip32::DerivationPath;
use bitcoin::Network;

use crate::hwi::error::Error;
use crate::hwi::types::{HWIDevice, HWIDeviceInternal, HWIExtendedPubKey};

enum Architecture {
    X86_64,
    ARM64,
    AARCH64,
}

// TODO: In the future we might want to ensure we only include the right binary for the architecture when building the app.
fn get_system_info() -> (String, Architecture) {
    let os = env::consts::OS.to_string();
    let arch = match env::consts::ARCH {
        "x86_64" => Architecture::X86_64,
        "aarch64" => Architecture::AARCH64,
        "arm" | "arm64" => Architecture::ARM64,
        _ => panic!("Unsupported architecture"),
    };
    (os, arch)
}

macro_rules! deserialize_obj {
    ( $e: expr ) => {{
        let value: Value = serde_json::from_str($e)?;
        let obj = value.clone();
        serde_json::from_value(value)
            .map_err(|e| Error::Hwi(format!("error {} while deserializing {}", e, obj), None))
    }};
}

pub struct HWIClient {
    hwi_path: PathBuf,
    test_mode: bool,
    pub device_fingerprint: Option<String>,
    pub device_type: Option<String>,
    pub network: Network,
}

impl HWIClient {
    pub fn new(hwi_path: PathBuf, test_mode: bool) -> Self {
        HWIClient {
            hwi_path,
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
            "bitcoin" | "BITCOIN" => self.network = Network::Bitcoin,
            "testnet" | "TESTNET" => self.network = Network::Testnet,
            _ => log::warn!("Unsupported network: {}", network),
        }
    }

    pub fn get_hwi_binary_name() -> &'static str {
        let (os, arch) = get_system_info();
        match (os.as_str(), arch) {
            ("windows", Architecture::X86_64) => "hwi-windows-x86_64.exe",
            ("macos", Architecture::X86_64) => "hwi-mac-x86_64",
            ("macos", Architecture::ARM64) => "hwi-mac-arm64",
            ("macos", Architecture::AARCH64) => "hwi-mac-arm64",
            ("linux", Architecture::X86_64) => "hwi-linux-x86_64",
            ("linux", Architecture::AARCH64) => "hwi-linux-aarch64",
            _ => panic!("Unsupported OS/architecture combination"),
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

        if !self.hwi_path.exists() {
            return Err(Error::Hwi(
                format!("HWI binary not found at {:?}", self.hwi_path),
                None,
            ));
        }

        let output = Command::new(&self.hwi_path)
            .args(&command_args)
            .output()
            .map_err(|e| Error::Hwi(format!("Failed to execute HWI command: {}", e), None))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(Error::Hwi(
                String::from_utf8_lossy(&output.stderr).to_string(),
                None,
            ))
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
