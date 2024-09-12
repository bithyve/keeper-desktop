import BaseModal from "../BaseModal/BaseModal";
import styles from "./DeviceActionSuccessModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import successIcon from "../../assets/hwi-success-icon.svg";
import { HWI_ACTION, HWI_DEVICES, HWIDeviceType } from "../../helpers/devices";

interface DeviceActionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: HWIDeviceType;
  actionType: HWI_ACTION;
  onConnectConfirmed: () => void;
}

const DeviceActionSuccessModal = ({
  isOpen,
  onClose,
  deviceType,
  actionType,
  onConnectConfirmed,
}: DeviceActionSuccessModalProps) => {
  const handleContinue = async () => {
    switch (actionType) {
      case "connect":
        onConnectConfirmed();
        break;
      default:
        onClose();
    }
  };

  const getModalContent = () => {
    const deviceName = HWI_DEVICES[deviceType].name;
    switch (actionType) {
      case "connect":
        return {
          title: `${deviceName} Connected`,
          text: `Your ${deviceName} has now securely established connection to the Keeper desktop app and is ready for use.`,
        };
      case "shareXpubs":
        return {
          title: `Device Added`,
          text: `Your ${deviceName} has successfully been added to Keeper App and is now available for use.`,
        };
      case "healthCheck":
        return {
          title: `Health Check Successful!`,
          text: `Your ${deviceName} health check was completed successfully.`,
        };
      case "signTx":
        return {
          title: `Transaction Signed Successfully!`,
          text: `Your transaction has been successfully signed and processed.`,
        };
      case "registerMultisig":
        return {
          title: `Multisig Registered Successfully!`,
          text: `Your multisig has been successfully registered in your ${deviceName} and is now available for use.`,
        };
      case "verifyAddress":
        return {
          title: `Address Verified`,
          text: `If the address displayed on your ${deviceName} matched the address on the Keeper mobile app, you can safely use it to receive funds. Otherwise, please contact support.`,
        };
    }
  };

  const { title, text } = getModalContent();

  const modalContent = {
    image: (
      <img
        src={successIcon}
        alt="Success"
        className={`${baseStyles.icon} ${styles.icon}`}
      />
    ),
    title: <h2 className={`${baseStyles.title} ${styles.title}`}>{title}</h2>,
    content: <p className={`${baseStyles.text} ${styles.text}`}>{text}</p>,
    button: (
      <button
        className={`${baseStyles.continueButton} ${styles.continueButton}`}
        onClick={handleContinue}
      >
        {actionType === "connect" ? "Continue" : "Done"}
      </button>
    ),
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalContent={modalContent} />
  );
};

export default DeviceActionSuccessModal;
