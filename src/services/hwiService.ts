import { invoke } from "@tauri-apps/api/tauri";
import { HWIDevice } from "../helpers/devices";

const hwiService = {
  fetchHwiAvailability: async (): Promise<boolean> => {
    return await invoke<boolean>("is_hwi_available");
  },

  fetchDevices: async (): Promise<HWIDevice[]> => {
    const isAvailable = await hwiService.fetchHwiAvailability();
    if (!isAvailable) {
      throw new Error("HWI client not available");
    }
    return await invoke<HWIDevice[]>("hwi_enumerate");
  },
};

export default hwiService;
