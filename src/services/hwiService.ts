import { invoke } from "@tauri-apps/api/tauri";
import { HWIDevice, HWIDeviceType } from "../helpers/devices";

const hwiService = {
  fetchDevices: async (): Promise<HWIDevice[]> => {
    const devices = await invoke<HWIDevice[]>("hwi_enumerate");
    return devices.map((device) => ({
      ...device,
      device_type: device.device_type.toLowerCase() as HWIDeviceType,
    }));
  },

  setDeviceInfo: async (fingerprint: string, deviceType: string): Promise<void> => {
    await invoke<void>("set_device_info", { fingerprint, deviceType });
  },

  shareXpubs: async (): Promise<string> => {
    let res = await invoke<string>("share_xpubs");
    console.log(res);
    return res;
  },

  performHealthCheck: async (): Promise<string> => {
    let res = await invoke<string>("device_healthcheck");
    console.log(res);
    return res;
  },
};

export default hwiService;
