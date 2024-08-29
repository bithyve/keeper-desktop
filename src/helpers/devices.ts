import bitboxIcon from "../assets/hww/icons/bitbox.svg";
import trezorIcon from "../assets/hww/icons/trezor.svg";
import ledgerIcon from "../assets/hww/icons/ledger.svg";
import coldcardIcon from "../assets/hww/icons/coldcard.svg";
import jadeIcon from "../assets/hww/icons/jade.svg";
import ledgerIconModal from "../assets/hww/icons-modal/ledger.svg";
import trezorIconModal from "../assets/hww/icons-modal/trezor.svg";
import bitboxIconModal from "../assets/hww/icons-modal/bitbox.svg";
// import coldcardIconModal from "../assets/hww/icons-modal/coldcard.svg";
// import jadeIconModal from "../assets/hww/icons-modal/jade.svg";

const HWI_DEVICES = {
  ledger: {
    icon: ledgerIcon,
    name: "Ledger",
  },
  trezor: {
    icon: trezorIcon,
    name: "Trezor",
  },
  bitbox02: {
    icon: bitboxIcon,
    name: "BitBox02",
  },
  coldcard: {
    icon: coldcardIcon,
    name: "Coldcard",
  },
  jade: {
    icon: jadeIcon,
    name: "Jade",
  },
  // BitBox01: {
  //   icon: bitboxIcon,
  //   name: "BitBox01",
  // },
  // KeepKey: {
  //   icon: keepkeyIcon,
  //   name: "KeepKey",
  // },
  // Other: {
  //   icon: otherIcon,
  //   name: "Other",
  // },
};


interface DeviceContent {
  icon: string;
  content: Record<string, string>;
}

type HWIDeviceType = keyof typeof HWI_DEVICES;

const deviceContent: Record<HWIDeviceType, DeviceContent> = {
  ledger: {
    icon: ledgerIconModal,
    content: {
      connect:
        "Your Mobile app is trying to connect to Ledger. Please connect your Ledger via USB to continue with Keeper Desktop app.",
      shareXpubs:
        "Keep your Ledger device connected to the computer before proceeding. Please make sure you have BTC app downloaded on Ledger before this step.",
      healthCheck:
        "Your Mobile app is trying to perform a health check. Please keep your Ledger connected to the computer to continue with Keeper Desktop app.",
      signTx:
        "Please sign the transaction by approving it on the connected Ledger device.",
      registerMultisig:
        "Please approve the registration of the multisig on the connected Ledger device.",
    },
  },
  trezor: {
    icon: trezorIconModal,
    content: {
      connect:
        "Your Mobile app is trying to connect to Trezor. Please connect and unlock your Trezor to the computer to continue with Keeper Desktop app",
      shareXpubs:
        "Keep your Trezor device connected to the computer before proceeding. Please make sure you have BTC app downloaded on Trezor before this step.",
      healthCheck:
        "Your Mobile app is trying to perform a health check. Please keep your Trezor connected to the computer to continue with Keeper Desktop app.",
      signTx:
        "Please sign the transaction by approving it on the connected Trezor device.",
      registerMultisig: "Operation not supported on Trezor",
    },
  },
  bitbox02: {
    icon: bitboxIconModal,
    content: {
      connect:
        "Your Mobile app is trying to connect to BitBox02. Please connect and unlock your BitBox02 to the computer to continue with Keeper Desktop app",
      shareXpubs:
        "Keep your BitBox02 device connected to the computer before proceeding. Please make sure the device was setup with the BitBox02 app before using it with Keeper Desktop App.",
      healthCheck:
        "Your Mobile app is trying to perform a health check. Please keep your BitBox02 connected to the computer to continue with Keeper Desktop app.",
      signTx:
        "Please sign the transaction by approving it on the connected BitBox02 device.",
      registerMultisig:
        "Please approve the registration of the multisig on the connected BitBox02 device.",
    },
  },
  coldcard: {
    icon: coldcardIcon, // coldcardIconModal,
    content: {},
  },
  jade: {
    icon: jadeIcon, // jadeIconModal,
    content: {},
  },
};

export default deviceContent;

interface HWIDevice {
  device_type: HWIDeviceType;
  model: string;
  path: string;
  needs_pin_sent: boolean;
  needs_passphrase_sent: boolean;
  fingerprint: string;
}

export { HWI_DEVICES, type HWIDeviceType, type HWIDevice };