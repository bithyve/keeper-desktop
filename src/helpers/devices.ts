import bitboxIcon from "../assets/hww/bitbox.svg";
import trezorIcon from "../assets/hww/trezor.svg";
import ledgerIcon from "../assets/hww/ledger.svg";

const DEVICES = {
  trezor: {
    icon: trezorIcon,
    name: "Trezor",
  },
  ledger: {
    icon: ledgerIcon,
    name: "Ledger",
  },
  bitbox: {
    icon: bitboxIcon,
    name: "Bitbox02",
  },
};

interface Device {
  type: keyof typeof DEVICES;
  xfp: string;
}

export { DEVICES, type Device };