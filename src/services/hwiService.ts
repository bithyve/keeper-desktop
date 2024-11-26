import { invoke } from "@tauri-apps/api/tauri";
import { HWIDevice, HWIDeviceType } from "../helpers/devices";

interface Result<T> {
  Ok: T;
  Err: string;
}

const emptyTrezorDevice: HWIDevice = {
  device_type: "trezor",
  needs_pin_sent: true,
  model: "",
  path: "",
  needs_passphrase_sent: false,
  fingerprint: null,
};

const hwiService = {
  fetchDevices: async (
    deviceType: HWIDeviceType | null = null,
    network: string | null = null,
  ): Promise<HWIDevice[]> => {
    if (network === "mainnet") {
      network = "bitcoin";
    }
    const devices = await invoke<Result<HWIDevice>[]>("hwi_enumerate", {
      network,
    });
    const updatedDevices = devices.map((device) =>
      device.Err && device.Err.includes("Trezor is locked")
        ? { Ok: emptyTrezorDevice }
        : device,
    );
    return updatedDevices
      .filter(
        (device) =>
          !deviceType || (device.Ok && device.Ok.device_type === deviceType),
      )
      .map((device) => ({
        ...device.Ok,
        device_type: device.Ok.device_type.toLowerCase() as HWIDeviceType,
      }));
  },

  setHWIClient: async (
    fingerprint: string | null,
    deviceType: string,
    network: string,
  ): Promise<void> => {
    if (network === "mainnet") {
      network = "bitcoin";
    }
    await invoke<void>("set_hwi_client", { fingerprint, deviceType, network });
  },

  shareXpubs: async (account: number): Promise<void> => {
    const eventData = await invoke("hwi_get_xpubs", { account });
    await invoke("emit_to_channel", { eventData });
  },

  performHealthCheck: async (account: number): Promise<void> => {
    const eventData = await invoke<void>("hwi_healthcheck", { account });
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

  promptPin: async (): Promise<void> => {
    await invoke<void>("hwi_prompt_pin");
  },

  sendPin: async (pin: string): Promise<void> => {
    await invoke<void>("hwi_send_pin", { pin });
  },
};

export default hwiService;
