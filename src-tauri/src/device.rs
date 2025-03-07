use crate::hwi::error::Error as HWIError;
use crate::HWIClientState;
use bitcoin::bip32::DerivationPath;
use bitcoin::Network;
use serde_json::json;

pub enum ScriptType {
    P2WPKH,
    P2WSH,
    P2TR,
}

pub fn get_xpubs(
    hwi_state: &HWIClientState,
    account: usize,
) -> Result<serde_json::Value, HWIError> {
    let ss_path = get_derivation_path(ScriptType::P2WPKH, hwi_state.network, account);
    let ms_path = get_derivation_path(ScriptType::P2WSH, hwi_state.network, account);
    let tr_path = get_derivation_path(ScriptType::P2TR, hwi_state.network, account);

    let single_sig_xpub = hwi_state.hwi.get_xpub(&ss_path, false)?;
    let multi_sig_xpub = hwi_state.hwi.get_xpub(&ms_path, false)?;
    let taproot_xpub = hwi_state.hwi.get_xpub(&tr_path, false)?;

    if hwi_state.fingerprint.is_none() {
        return Err(HWIError::Hwi(
            "Device fingerpring is missing".to_string(),
            None,
        ));
    }

    Ok(json!({
        "singleSigPath": ss_path.to_string(),
        "singleSigXpub": single_sig_xpub.to_string(),
        "multiSigPath": ms_path.to_string(),
        "multiSigXpub": multi_sig_xpub.to_string(),
        "taprootPath": tr_path.to_string(),
        "taprootXpub": taproot_xpub.to_string(),
        "mfp": hwi_state.fingerprint.as_ref().unwrap().to_string().to_uppercase(),
    }))
}

fn get_derivation_path(
    script_type: ScriptType,
    network: Network,
    account: usize,
) -> DerivationPath {
    let network_num = match network {
        Network::Bitcoin => 0,
        Network::Testnet | Network::Signet | Network::Regtest => 1,
        _ => panic!("Unsupported Network"),
    };
    match script_type {
        ScriptType::P2WPKH => format!("m/84'/{}'/{}'", network_num, account)
            .parse()
            .unwrap(),
        ScriptType::P2WSH => format!("m/48'/{}'/{}'/2'", network_num, account)
            .parse()
            .unwrap(),
        ScriptType::P2TR => format!("m/86'/{}'/{}'", network_num, account)
            .parse()
            .unwrap(),
    }
}
