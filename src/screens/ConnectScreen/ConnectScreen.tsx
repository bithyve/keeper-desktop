import styles from "./ConnectScreen.module.css";
import keeperLogo from "../../assets/keeper-logo.png";
import instructionsIcon from "../../assets/instructions-icon.svg";
import refreshIcon from "../../assets/refresh.svg";

import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import QRCode from 'qrcode.react';
import DeviceDeviceActionModal from "../../modals/DeviceActionModal/DeviceActionModal";
import DeviceDeviceActionSuccessModal from "../../modals/DeviceActionSuccessModal/DeviceActionSuccessModal";
import DeviceNotFoundModal from "../../modals/DeviceNotFoundModal/DeviceNotFoundModal";
import MultipleDevicesModal from "../../modals/MultipleDevicesModal/MultipleDevicesModal";
import { HWIDevice, HWIDeviceType } from "../../helpers/devices";
import hwiService from "../../services/hwiService";

const ConnectScreen = () => {
  const [isDeviceActionModalOpen, setIsDeviceActionModalOpen] = useState(false);
  const [isDeviceActionSuccessModalOpen, setIsDeviceActionSuccessModalOpen] = useState(false);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  const [isMultipleDevicesModalOpen, setIsMultipleDevicesModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<HWIDeviceType | null>(null);
  const [currentAction, setCurrentAction] = useState<"connect" | "shareXpubs" | "healthCheck" | "signTx" | "registerMultisig">("connect");
  const [actionType, setActionType] = useState<"shareXpubs" | "healthCheck" | "signTx" | "registerMultisig" | null>(null);
  const [network, setNetwork] = useState<"TESTNET" | "MAINNET" | null>(null);
  const [psbt, setPsbt] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<string | null>(null);

  const openDeviceActionModal = () => setIsDeviceActionModalOpen(true);
  const openDeviceActionSuccessModal = () => setIsDeviceActionSuccessModalOpen(true);
  const openNotFoundModal = () => setIsNotFoundModalOpen(true);
  const openMultipleDevicesModal = () => setIsMultipleDevicesModalOpen(true);
  const closeDeviceActionModal = () => setIsDeviceActionModalOpen(false);
  const closeDeviceActionSuccessModal = () => setIsDeviceActionSuccessModalOpen(false);
  const closeNotFoundModal = () => setIsNotFoundModalOpen(false);
  const closeMultipleDevicesModal = () => setIsMultipleDevicesModalOpen(false);

  const handleConnectResult = async (devices: HWIDevice[]) => {
    if (devices.length > 1) {
      openMultipleDevicesModal();
    } else if (devices.length === 0) {
      openNotFoundModal();
    } else {
      if (deviceType && network) {
        await hwiService.setHWIClient(devices[0].fingerprint, deviceType, network.toLowerCase());
        openDeviceActionSuccessModal();
      }
    }
    closeDeviceActionModal();
  };

  const handleActionSuccess = () => {
    closeDeviceActionModal();
    openDeviceActionSuccessModal();
  };

  const handleError = (error: string) => {
    console.log("handleError", error);
    closeDeviceActionModal();
    // TODO: handle error
  };

  const [qrData, setQrData] = useState('');

  const setupChannel = useCallback(async () => {    
    const channelSecret = await invoke<string>('generate_encryption_key');
    setQrData(channelSecret);
  }, []);

  useEffect(() => {
    setupChannel();

    const unsubscribe = listen("channel-message", async (channelMessage: any) => {
      const { data, network} = channelMessage.payload;
      console.log("channelMessage", data);
      setDeviceType(data.signerType.toLowerCase() as HWIDeviceType);
      switch (data.action) {
        case "ADD_DEVICE":
          setActionType("shareXpubs");
          break;
        case "HEALTH_CHECK":
          setActionType("healthCheck");
          break;
        case "SIGN_TX":
          setActionType("signTx");
          setPsbt(data.psbt);
          break;
        case "REGISTER_MULTISIG":
          setActionType("registerMultisig");
          setDescriptor(data.descriptor);
          break;
      }
      setNetwork(network as "TESTNET" | "MAINNET");
      setCurrentAction("connect");
      openDeviceActionModal();
    });

    return () => {
      unsubscribe.then(f => f());
    };
  }, [setupChannel]);

  return (
    <div className={styles.connectScreen}>
      <div className={styles.leftSection}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <h1 className={styles.title}>Welcome to Keeper Desktop App</h1>
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionsTitle}>
            <img
              src={instructionsIcon}
              className={styles.instructionsIcon}
              alt=""
            />
            Instructions:
          </h3>
          <ul className={styles.instructionsList}>
            <li>From the keeper app, open QR scanner and Scan this app</li>
            <li>
              You can use this for adding a device, registering a vault, or to
              sign transactions
            </li>
            <li>
              You will need a new QR for each operation you perform, by just
              refreshing
            </li>
          </ul>
        </div>
        <div className={styles.note}>
          <h4>Note:</h4>
          <p>
            This QR will get you the key to Decrypt the data from this Keeper
            Web Interface to make communication E2R encrypted
          </p>
        </div>
      </div>
      <div className={styles.qrContainer}>
        <div className={styles.qrCode}>
          <QRCode value={qrData} size={200} bgColor="#2d6759" fgColor="#fff" />
          <p className={styles.scanMe}>Scan Me</p>
          <button className={styles.regenerateButton} onClick={setupChannel}>
            <img src={refreshIcon} alt="Regenerate QR Code" />
          </button>
        </div>
        <p className={styles.qrNote}>
          Make sure No one is around you when you scan this. You can always
          refresh to get fresh key session
        </p>
      </div>
      {deviceType && (
        <>
          <DeviceDeviceActionModal
            isOpen={isDeviceActionModalOpen}
            onClose={closeDeviceActionModal}
            deviceType={deviceType}
            actionType={currentAction}
            psbt={psbt}
            descriptor={descriptor}
            onConnectResult={handleConnectResult}
            onActionSuccess={handleActionSuccess}
            onError={handleError}
          />

          <DeviceDeviceActionSuccessModal
            isOpen={isDeviceActionSuccessModalOpen}
            onClose={closeDeviceActionSuccessModal}
            deviceType={deviceType}
            actionType={currentAction}
            onConnectConfirmed={() => {
              closeDeviceActionSuccessModal();
              if (actionType) {
                setCurrentAction(actionType);
                openDeviceActionModal();
              }
            }}
          />

          <DeviceNotFoundModal
            isOpen={isNotFoundModalOpen}
            onClose={closeNotFoundModal}
            deviceType={deviceType}
            onContinue={() => {
              closeNotFoundModal();
              openDeviceActionModal();
            }}
          />

          <MultipleDevicesModal
            isOpen={isMultipleDevicesModalOpen}
            onClose={closeMultipleDevicesModal}
            deviceType={deviceType}
            onContinue={() => {
              closeMultipleDevicesModal();
              openDeviceActionModal();
            }}
          />
        </>
      )}
    </div>
  );
};

export default ConnectScreen;