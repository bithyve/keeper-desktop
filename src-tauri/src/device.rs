use crate::hwi::error::Error as HWIError;
use crate::HWIClientState;
use bitcoin::bip32::DerivationPath;
use bitcoin::Network;
use serde_json::json;

pub enum ScriptType {
    P2WPKH,
    P2WSH,
}

pub fn get_xpub(hwi_state: &HWIClientState) -> Result<serde_json::Value, HWIError> {
    let ss_path = get_derivation_path(ScriptType::P2WPKH, hwi_state.network);
    let ms_path = get_derivation_path(ScriptType::P2WSH, hwi_state.network);

    let single_sig_xpub = hwi_state.hwi.get_xpub(&ss_path, false)?;
    let multi_sig_xpub = hwi_state.hwi.get_xpub(&ms_path, false)?;

    Ok(json!({
        "singleSigPath": format!("m/{}", ss_path.to_string()),
        "singleSigXpub": single_sig_xpub.to_string(),
        "multiSigPath": format!("m/{}", ms_path.to_string()),
        "multiSigXpub": multi_sig_xpub.to_string(),
        "mfp": hwi_state.fingerprint.to_string().to_uppercase(),
    }))
}

fn get_derivation_path(script_type: ScriptType, network: Network) -> DerivationPath {
    match (script_type, network) {
        (ScriptType::P2WPKH, Network::Bitcoin) => "m/84'/0'/0'".parse().unwrap(),
        (ScriptType::P2WPKH, Network::Testnet) => "m/84'/1'/0'".parse().unwrap(),
        (ScriptType::P2WSH, Network::Bitcoin) => "m/48'/0'/0'/2'".parse().unwrap(),
        (ScriptType::P2WSH, Network::Testnet) => "m/48'/1'/0'/2'".parse().unwrap(),
        _ => panic!("Unsupported script type or network"),
    }
}
