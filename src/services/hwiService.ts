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
    const eventData = await invoke("hwi_get_xpubs");
    await invoke("emit_to_channel", { eventData });
  },

  performHealthCheck: async (): Promise<void> => {
    const eventData = await invoke<void>("hwi_healthcheck");
    await invoke<void>("emit_to_channel", { eventData });
  },

  signTx: async (psbt: string): Promise<void> => {
    const eventData = await invoke<void>("hwi_sign_tx", { psbt });
    await invoke<void>("emit_to_channel", { eventData });
  },

  registerMultisig: async (
    descriptor: string,
    expectedAddress: string,
  ): Promise<void> => {
    const eventData = await invoke<void>("hwi_register_multisig", {
      descriptor,
      expectedAddress,
    });
    await invoke<void>("emit_to_channel", { eventData });
  },

  verifyAddress: async (
    descriptor: string,
    expectedAddress: string,
  ): Promise<void> => {
    const eventData = await invoke<void>("hwi_verify_address", {
      descriptor,
      expectedAddress,
    });
    await invoke<void>("emit_to_channel", { eventData });
  },

  sendPin: async (pin: string): Promise<void> => {
    await invoke<void>("hwi_send_pin", { pin });
  },
};

export default hwiService;
