import bitboxIcon from "../assets/hww/icons/bitbox.svg";
import trezorIcon from "../assets/hww/icons/trezor.svg";
import ledgerIcon from "../assets/hww/icons/ledger.svg";
// import coldcardIcon from "../assets/hww/icons/coldcard.svg";
// import jadeIcon from "../assets/hww/icons/jade.svg";
import ledgerIconModal from "../assets/hww/icons-modal/ledger.svg";
import trezorIconModal from "../assets/hww/icons-modal/trezor.svg";
import bitboxIconModal from "../assets/hww/icons-modal/bitbox.svg";
// import coldcardIconModal from "../assets/hww/icons-modal/coldcard.svg";
// import jadeIconModal from "../assets/hww/icons-modal/jade.svg";

const HWI_ACTIONS = {
  connect: "connect",
  shareXpubs: "shareXpubs",
  healthCheck: "healthCheck",
  signTx: "signTx",
  registerMultisig: "registerMultisig",
  verifyAddress: "verifyAddress",
};

type HWI_ACTION = keyof typeof HWI_ACTIONS;

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
  // coldcard: {
  //   icon: coldcardIcon,
  //   name: "Coldcard",
  // },
  // jade: {
  //   icon: jadeIcon,
  //   name: "Jade",
  // },
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

interface HWIDevice {
  device_type: HWIDeviceType;
  model: string;
  path: string;
  needs_pin_sent: boolean;
  needs_passphrase_sent: boolean;
  fingerprint: string;
}

interface DeviceContent {
  icon: string;
  content: Record<HWI_ACTION, {text: string, list: string[]}>;
}

type HWIDeviceType = keyof typeof HWI_DEVICES;

const deviceContent: Record<HWIDeviceType, DeviceContent> = {
  ledger: {
    icon: ledgerIconModal,
    content: {
      connect: {
        text: "Your Mobile app is trying to connect to Ledger. Please connect your Ledger via USB to continue with Keeper Desktop app.",
        list: [],
      },
      shareXpubs: {
        text: "Keep your Ledger device connected to the computer before proceeding. Please make sure you have BTC app downloaded on Ledger before this step.",
        list: [
          "Health check is initiated if a signer is not used for last 180 days",
          "Please Make sure you have the BTC app downloaded on Ledger before this step",
        ],
      },
      healthCheck: {
        text: "Your Mobile app is trying to perform a health check. Please keep your Ledger connected to the computer to continue with Keeper Desktop app.",
        list: [],
      },
      signTx: {
        text: "Please sign the transaction by approving it on the connected Ledger device.",
        list: [],
      },
      registerMultisig: {
        text: "Please approve the registration of the multisig on the connected Ledger device.",
        list: [],
      },
      verifyAddress: {
        text: "",
        list: [
          "For security purpose we recommend verifying address on your Ledger.",
          "By verifying the address, you will be able to confirm the address shown on your device is same as shown in your Ledger.",
          "The Address displayed on your Ledger cannot be compromised.",
        ],
      },
    },
  },
  trezor: {
    icon: trezorIconModal,
    content: {
      connect: {
        text: "Your Mobile app is trying to connect to Trezor. Please connect and unlock your Trezor to the computer to continue with Keeper Desktop app",
        list: [],
      },
      shareXpubs: {
        text: "Keep your Trezor device connected to the computer before proceeding. Please make sure you have BTC app downloaded on Trezor before this step.",
        list: [],
      },
      healthCheck: {
        text: "Your Mobile app is trying to perform a health check. Please keep your Trezor connected to the computer to continue with Keeper Desktop app.",
        list: [],
      },
      signTx: {
        text: "Please sign the transaction by approving it on the connected Trezor device.",
        list: [],
      },
      registerMultisig: {
        text: "Operation not supported on Trezor",
        list: [],
      },
      verifyAddress: {
        text: "",
        list: [
          "For security purpose we recommend verifying address on your Trezor.",
          "By verifying the address, you will be able to confirm the address shown on your device is same as shown in your Trezor.",
          "The Address displayed on your Trezor cannot be compromised.",
        ],
      },
    },
  },
  bitbox02: {
    icon: bitboxIconModal,
    content: {
      connect: {
        text: "Your Mobile app is trying to connect to BitBox02. Please connect and unlock your BitBox02 to the computer to continue with Keeper Desktop app",
        list: [],
      },
      shareXpubs: {
        text: "Keep your BitBox02 device connected to the computer before proceeding. Please make sure the device was setup with the BitBox02 app before using it with Keeper Desktop App.",
        list: [],
      },
      healthCheck: {
        text: "Your Mobile app is trying to perform a health check. Please keep your BitBox02 connected to the computer to continue with Keeper Desktop app.",
        list: [],
      },
      signTx: {
        text: "Please sign the transaction by approving it on the connected BitBox02 device.",
        list: [],
      },
      registerMultisig: {
        text: "Please approve the registration of the multisig on the connected BitBox02 device.",
        list: [],
      },
      verifyAddress: {
        text: "",
        list: [
          "For security purpose we recommend verifying address on your BitBox02.",
          "By verifying the address, you will be able to confirm the address shown on your device is same as shown in your BitBox02.",
          "The Address displayed on your BitBox02 cannot be compromised.",
        ],
      },
    },
  },
  // coldcard: {
  //   icon: coldcardIcon, // coldcardIconModal,
  //   content: {},
  // },
  // jade: {
  //   icon: jadeIcon, // jadeIconModal,
  //   content: {},
  // },
};

export { HWI_DEVICES, HWI_ACTIONS, deviceContent, type HWI_ACTION , type HWIDeviceType, type HWIDevice };