import styles from "./ConnectScreen.module.css";
import keeperLogo from "../../assets/keeper-with-slogan-logo.png";
import instructionsIcon from "../../assets/instructions-icon.svg";
import refreshIcon from "../../assets/refresh.svg";

import { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import QRCode from 'qrcode.react';
import DeviceDeviceActionModal from "../../modals/DeviceActionModal/DeviceActionModal";
import DeviceDeviceActionSuccessModal from "../../modals/DeviceActionSuccessModal/DeviceActionSuccessModal";
import DeviceNotFoundModal from "../../modals/DeviceNotFoundModal/DeviceNotFoundModal";
import MultipleDevicesModal from "../../modals/MultipleDevicesModal/MultipleDevicesModal";
import ErrorModal from "../../modals/ErrorModal/ErrorModal";
import { HWI_ACTION, HWIDevice, HWIDeviceType } from "../../helpers/devices";
import hwiService from "../../services/hwiService";
import TrezorPinModal from "../../modals/TrezorPinModal/TrezorPinModal";

const ConnectScreen = () => {
  const [isDeviceActionModalOpen, setIsDeviceActionModalOpen] = useState(false);
  const [isDeviceActionSuccessModalOpen, setIsDeviceActionSuccessModalOpen] = useState(false);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  const [isMultipleDevicesModalOpen, setIsMultipleDevicesModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<HWIDeviceType | null>(null);
  const [currentAction, setCurrentAction] = useState<HWI_ACTION>("connect");
  const [actionType, setActionType] = useState<HWI_ACTION | null>(null);
  const [network, setNetwork] = useState<"TESTNET" | "MAINNET" | null>(null);
  const [psbt, setPsbt] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);

  const openDeviceActionModal = () => setIsDeviceActionModalOpen(true);
  const openDeviceActionSuccessModal = () => setIsDeviceActionSuccessModalOpen(true);
  const openNotFoundModal = () => setIsNotFoundModalOpen(true);
  const openMultipleDevicesModal = () => setIsMultipleDevicesModalOpen(true);
  const openErrorModal = () => setIsErrorModalOpen(true);
  const openPinModal = () => setShowPinModal(true);
  const closeDeviceActionModal = () => setIsDeviceActionModalOpen(false);
  const closeDeviceActionSuccessModal = () => setIsDeviceActionSuccessModalOpen(false);
  const closeNotFoundModal = () => setIsNotFoundModalOpen(false);
  const closeMultipleDevicesModal = () => setIsMultipleDevicesModalOpen(false);
  const closeErrorModal = () => setIsErrorModalOpen(false);
  const closePinModal = () => setShowPinModal(false);

  const handleConnectResult = async (devices: HWIDevice[]) => {
    if (devices.length > 1) {
      openMultipleDevicesModal();
    } else if (devices.length === 0) {
      openNotFoundModal();
    } else {
      if (deviceType && network) {
        await hwiService.setHWIClient(devices[0].fingerprint, deviceType, network.toLowerCase());
        if (devices[0].needs_pin_sent) {
          openPinModal();
        } else {
          openDeviceActionSuccessModal();
        }
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
    setErrorMessage(error);
    openErrorModal();
  };

  const { data: channelSecret, refetch: regenerateQR } = useQuery({
    queryKey: ["channelSecret"],
    queryFn: () => invoke<string>("generate_encryption_key"),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
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
          setPsbt(data.psbt.serializedPSBT);
          break;
        case "REGISTER_MULTISIG":
          setActionType("registerMultisig");
          const descriptor = data.descriptorString.replace(/\*\*/g, "0/0");
          setDescriptor(descriptor);
          setExpectedAddress(data.firstExtAdd);
          break;
        case "VERIFY_ADDRESS":
          setActionType("verifyAddress");
          setDescriptor(data.descriptorString);
          break;
      }
      setNetwork(network as "TESTNET" | "MAINNET");
      setCurrentAction("connect");
      openDeviceActionModal();
    });

    return () => {
      unsubscribe.then(f => f());
    };
  }, []);

  return (
    <div className={styles.connectScreen}>
      <div className={styles.leftSection}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <h1 className={styles.title}>
          Welcome to Bitcoin Keeper’s Desktop App
        </h1>
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
            <li>
              You can add devices, register vaults and sign transactions using
              Keeper's desktop app.
            </li>
            <li>
              Open the QR scanner from the Keeper mobile app and scan the QR
              alongside.
            </li>
            <li>
              Please refresh the QR for every new operation (adding keys,
              registering vaults, signing transactions, health checks) you
              perform.
            </li>
          </ul>
        </div>
        <div className={styles.note}>
          <h4>Note:</h4>
          <p>
            This QR will get you the key to Decrypt the data from this Keeper
            Web Interface to make communication E2R encrypted.
          </p>
        </div>
      </div>
      <div className={styles.qrContainer}>
        <div className={styles.qrCode}>
          <QRCode
            value={channelSecret ?? ""}
            size={200}
            bgColor="#2d6759"
            fgColor="#fff"
          />
          <p className={styles.scanMe}>Scan Me</p>
          <button
            className={styles.regenerateButton}
            onClick={() => regenerateQR()}
          >
            <img src={refreshIcon} alt="Regenerate QR Code" />
          </button>
        </div>
        <p className={styles.qrNote}>
          Make sure No one is around you when you scan this. You can always
          refresh to get fresh key session.
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
          <ErrorModal
            isOpen={isErrorModalOpen}
            onClose={closeErrorModal}
            errorMessage={errorMessage}
            onRetry={() => {
              closeErrorModal();
              openDeviceActionModal();
            }}
          />
          <TrezorPinModal
            isOpen={showPinModal}
            onClose={closePinModal}
            onSuccess={() => {
              closePinModal();
              openDeviceActionSuccessModal();
            }}
          />
        </>
      )}
    </div>
  );
};

export default ConnectScreen;