import bitboxIcon from "../assets/hww/icons/bitbox.svg";
import trezorIcon from "../assets/hww/icons/trezor.svg";
import ledgerIcon from "../assets/hww/icons/ledger.svg";
import coldcardIcon from "../assets/hww/icons/coldcard.svg";
import jadeIcon from "../assets/hww/icons/jade.svg";
import bitboxIconWhite from "../assets/hww/icons-white/bitbox.svg";
import trezorIconWhite from "../assets/hww/icons-white/trezor.svg";
import ledgerIconWhite from "../assets/hww/icons-white/ledger.svg";
import coldcardIconWhite from "../assets/hww/icons-white/coldcard.svg";
import jadeIconWhite from "../assets/hww/icons-white/jade.svg";
// import keepkeyIcon from "../assets/hww/keepkey.svg";
// import otherIcon from "../assets/hww/other.svg";

const HWI_DEVICES = {
  ledger: {
    icon: ledgerIcon,
    iconWhite: ledgerIconWhite,
    name: "Ledger",
    register_multisig: true,
  },
  trezor: {
    icon: trezorIcon,
    iconWhite: trezorIconWhite,
    name: "Trezor",
    register_multisig: false,
  },
  bitbox02: {
    icon: bitboxIcon,
    iconWhite: bitboxIconWhite,
    name: "BitBox02",
    register_multisig: true,
  },
  coldcard: {
    icon: coldcardIcon,
    iconWhite: coldcardIconWhite,
    name: "Coldcard",
    register_multisig: false,
  },
  jade: {
    icon: jadeIcon,
    iconWhite: jadeIconWhite,
    name: "Jade",
    register_multisig: false,
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

type HWIDeviceType = keyof typeof HWI_DEVICES;

interface HWIDevice {
  device_type: HWIDeviceType;
  model: string;
  path: string;
  needs_pin_sent: boolean;
  needs_passphrase_sent: boolean;
  fingerprint: string;
}

export { HWI_DEVICES, type HWIDeviceType, type HWIDevice };