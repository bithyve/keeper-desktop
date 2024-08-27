use bitcoin::bip32::DerivationPath;
use bitcoin::Network;
use crate::hwi::interface::HWIClient;
use crate::hwi::error::Error as HWIError;
use serde_json::json;

pub enum ScriptType {
    P2WPKH,
    P2WSH,
}

pub fn get_xpub(client: &HWIClient, network: Network) -> Result<serde_json::Value, HWIError> {
    let ss_path = get_derivation_path(ScriptType::P2WPKH, network);
    let ms_path = get_derivation_path(ScriptType::P2WSH, network);

    let single_sig_xpub = client.get_xpub(&ss_path, false)?;
    let multi_sig_xpub = client.get_xpub(&ms_path, false)?;

    Ok(json!({
        "singleSigPath": ss_path.to_string(),
        "singleSigXpub": single_sig_xpub.to_string(),
        "multiSigPath": ms_path.to_string(),
        "multiSigXpub": multi_sig_xpub.to_string(),
        "mfp": hex::encode(client.device_fingerprint.as_deref().unwrap_or_default()),
    }))
}

fn get_derivation_path(script_type: ScriptType, network: Network) -> DerivationPath {
    match (script_type, network) {
        (ScriptType::P2WPKH, Network::Bitcoin) => "m/84'/0'/0'/0/0".parse().unwrap(),
        (ScriptType::P2WPKH, Network::Testnet) => "m/84'/1'/0'/0/0".parse().unwrap(),
        (ScriptType::P2WSH, Network::Bitcoin) => "m/48'/0'/0'/2'/0/0".parse().unwrap(),
        (ScriptType::P2WSH, Network::Testnet) => "m/48'/1'/0'/2'/0/0".parse().unwrap(),
        _ => panic!("Unsupported script type or network"),
    }
}