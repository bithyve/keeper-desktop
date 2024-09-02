import { invoke } from "@tauri-apps/api/tauri";
import { HWIDevice, HWIDeviceType } from "../helpers/devices";

const hwiService = {
  fetchDevices: async (
    deviceType: HWIDeviceType | null = null,
  ): Promise<HWIDevice[]> => {
    const devices = await invoke<HWIDevice[]>("hwi_enumerate");
    return devices
      .filter((device) => !deviceType || device.device_type === deviceType)
      .map((device) => ({
        ...device,
        device_type: device.device_type.toLowerCase() as HWIDeviceType,
      }));
  },

  setHWIClient: async (
    fingerprint: string,
    deviceType: string,
    network: string,
  ): Promise<void> => {
    await invoke<void>("set_hwi_client", { fingerprint, deviceType, network });
  },

  shareXpubs: async (): Promise<void> => {
    await invoke<void>("share_xpubs");
  },

  performHealthCheck: async (): Promise<void> => {
    await invoke<void>("device_healthcheck");
  },

  signTx: async (psbt: string): Promise<void> => {
    await invoke<void>("sign_tx", { psbt });
  },

  registerMultisig: async (
    descriptor: string,
    expectedAddress: string,
  ): Promise<void> => {
    await invoke<void>("register_multisig", { descriptor, expectedAddress });
  },

  verifyAddress: async (descriptor: string): Promise<void> => {
    await invoke<void>("verify_address", { descriptor });
  },

  sendPin: async (pin: string): Promise<void> => {
    await invoke<void>("send_pin", { pin });
  },
};

export default hwiService;
