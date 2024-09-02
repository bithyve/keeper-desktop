import styles from "./ConnectScreen.module.css";
import keeperLogo from "../../assets/keeper-with-slogan-logo.png";
import instructionsIcon from "../../assets/instructions-icon.svg";
import refreshIcon from "../../assets/refresh.svg";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import QRCode from "qrcode.react";
import useModalState from "../../hooks/useModalState";
import {
  HWI_ACTION,
  HWIDevice,
  HWIDeviceType,
  NetworkType,
} from "../../helpers/devices";
import ModalsManager from "../../modals/ModalManager";
import hwiService from "../../services/hwiService";

interface ChannelMessagePayload {
  data: {
    signerType: string;
    action: string;
    psbt?: { serializedPSBT: string };
    descriptorString?: string;
    firstExtAdd?: string;
  };
  network: string;
}

const ConnectScreen = () => {
  const { openModal, openModalHandler, closeModalHandler } = useModalState();

  const [deviceType, setDeviceType] = useState<HWIDeviceType | null>(null);
  const [currentAction, setCurrentAction] = useState<HWI_ACTION>("connect");
  const [actionType, setActionType] = useState<HWI_ACTION | null>(null);
  const [network, setNetwork] = useState<NetworkType | null>(null);
  const [psbt, setPsbt] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<string | null>(null);
  const [expectedAddress, setExpectedAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConnectResult = async (devices: HWIDevice[]) => {
    if (devices.length > 1) {
      openModalHandler("multipleDevices");
    } else if (devices.length === 0) {
      openModalHandler("notFound");
    } else {
      if (deviceType && network) {
        await hwiService.setHWIClient(
          devices[0].fingerprint,
          deviceType,
          network.toLowerCase(),
        );
        if (devices[0].needs_pin_sent) {
          openModalHandler("pin");
        } else {
          openModalHandler("deviceActionSuccess");
        }
      }
    }
  };

  const handleActionSuccess = () => {
    openModalHandler("deviceActionSuccess");
  };

  const handleError = useCallback(
    (error: string) => {
      setErrorMessage(error);
      openModalHandler("error");
    },
    [openModalHandler],
  );

  const { data: channelSecret, refetch: regenerateQR } = useQuery({
    queryKey: ["channelSecret"],
    queryFn: () => invoke<string>("generate_encryption_key"),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const unsubscribe = listen(
      "channel-message",
      async (channelMessage: { payload: ChannelMessagePayload }) => {
        const { data, network } = channelMessage.payload;
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
            if (data.psbt) {
              setPsbt(data.psbt.serializedPSBT);
            } else {
              handleError("PSBT was not provided");
            }
            break;
          case "REGISTER_MULTISIG":
            setActionType("registerMultisig");
            if (data.descriptorString) {
              setDescriptor(data.descriptorString.replace(/\*\*/g, "0/0"));
            } else {
              handleError("Descriptor was not provided");
            }
            if (data.firstExtAdd) {
              setExpectedAddress(data.firstExtAdd);
            } else {
              handleError("Expected address was not provided");
            }
            break;
          case "VERIFY_ADDRESS":
            setActionType("verifyAddress");
            if (data.descriptorString) {
              setDescriptor(data.descriptorString);
            } else {
              handleError("Descriptor is required");
            }
            break;
          default:
            handleError("Unsupported action received");
        }
        setNetwork(network as NetworkType);
        setCurrentAction("connect");
        openModalHandler("deviceAction");
      },
    );

    return () => {
      unsubscribe.then((f) => f());
    };
  }, [openModalHandler, handleError]);

  return (
    <div className={styles.connectScreen}>
      <div className={styles.leftSection}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <h1 className={styles.title}>
          Welcome to Bitcoin Keeper&apos;s Desktop App
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
              Keeper&apos;s desktop app.
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
        <ModalsManager
          openModal={openModal}
          closeModalHandler={closeModalHandler}
          deviceType={deviceType}
          currentAction={currentAction}
          actionType={actionType}
          psbt={psbt}
          descriptor={descriptor}
          expectedAddress={expectedAddress}
          errorMessage={errorMessage}
          handleConnectResult={handleConnectResult}
          handleActionSuccess={handleActionSuccess}
          handleError={handleError}
          setCurrentAction={setCurrentAction}
          openModalHandler={openModalHandler}
        />
      )}
    </div>
  );
};

export default ConnectScreen;
