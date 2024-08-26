import bitboxIcon from "../assets/hww/bitbox.svg";
import trezorIcon from "../assets/hww/trezor.svg";
import ledgerIcon from "../assets/hww/ledger.svg";
import coldcardIcon from "../assets/hww/coldcard.svg";
import jadeIcon from "../assets/hww/jade.svg";
// import keepkeyIcon from "../assets/hww/keepkey.svg";
// import otherIcon from "../assets/hww/other.svg";

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
  Coldcard: {
    icon: coldcardIcon,
    name: "Coldcard",
  },
  Jade: {
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

type HWIDeviceType = keyof typeof HWI_DEVICES;

interface HWIDevice {
  device_type: HWIDeviceType;
  model: string;
  path: string;
  needs_pin_sent: boolean;
  needs_passphrase_sent: boolean;
  fingerprint: string;
}

export { HWI_DEVICES, type HWIDevice };