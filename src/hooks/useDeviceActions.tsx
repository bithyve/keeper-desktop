import { useState } from "react";
import hwiService from "../services/hwiService";
import { HWI_ACTION, HWIDevice, HWIDeviceType } from "../helpers/devices";

interface UseDeviceActionsProps {
  deviceType: HWIDeviceType;
  actionType: HWI_ACTION;
  psbt: string | null;
  descriptor: string | null;
  expectedAddress: string | null;
  onConnectResult: (devices: HWIDevice[]) => void;
  onActionSuccess: () => void;
  onError: (error: string) => void;
}

export const useDeviceActions = ({
  deviceType,
  actionType,
  psbt,
  descriptor,
  expectedAddress,
  onConnectResult,
  onActionSuccess,
  onError,
}: UseDeviceActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      switch (actionType) {
        case "connect": {
          const devices = await hwiService.fetchDevices(deviceType);
          onConnectResult(devices);
          break;
        }
        case "shareXpubs":
          await hwiService.shareXpubs();
          onActionSuccess();
          break;
        case "healthCheck":
          await hwiService.performHealthCheck();
          onActionSuccess();
          break;
        case "signTx":
          if (!psbt) {
            onError("PSBT is required");
            return;
          }
          await hwiService.signTx(psbt);
          onActionSuccess();
          break;
        case "registerMultisig":
          if (!descriptor) {
            onError("Descriptor is required");
            return;
          }
          await hwiService.registerMultisig(descriptor, expectedAddress ?? "");
          onActionSuccess();
          break;
        case "verifyAddress":
          if (!descriptor) {
            onError("Descriptor is required");
            return;
          }
          await hwiService.verifyAddress(descriptor, expectedAddress ?? "");
          onActionSuccess();
          break;
        default:
          throw new Error("Unsupported action type");
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
      onError((error as any).toString()); // eslint-disable-line @typescript-eslint/no-explicit-any
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleContinue };
};
