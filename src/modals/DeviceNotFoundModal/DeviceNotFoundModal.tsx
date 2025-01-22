import BaseModal from "../BaseModal/BaseModal";
import styles from "./DeviceNotFoundModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import DeviceNotFoundIcon from "../../assets/device-not-found-icon.svg";
import { HWI_DEVICES, HWIDeviceType } from "../../helpers/devices";

interface DeviceNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: HWIDeviceType;
  onContinue: () => void;
}

const DeviceNotFoundModal = ({
  isOpen,
  onClose,
  deviceType,
  onContinue,
}: DeviceNotFoundModalProps) => {
  const getModalContent = () => ({
    title: `${HWI_DEVICES[deviceType].name} Not Found!`,
    text:
      deviceType === "bitbox02"
        ? `Your ${HWI_DEVICES[deviceType].name} failed to make connection with Keeper Desktop. Please make sure to close the BitBox app on your computer in case you have it open and try again`
        : `Your ${HWI_DEVICES[deviceType].name} failed to make connection with Keeper Desktop. Please try again`,
  });

  const { title, text } = getModalContent();

  const modalContent = {
    image: (
      <img
        src={DeviceNotFoundIcon}
        alt="Device not found"
        className={`${baseStyles.icon} ${styles.icon}`}
      />
    ),
    title: <h2 className={`${baseStyles.title} ${styles.title}`}>{title}</h2>,
    content: <p className={`${baseStyles.text} ${styles.text}`}>{text}</p>,
    button: (
      <button
        className={`${baseStyles.continueButton} ${styles.continueButton}`}
        onClick={onContinue}
      >
        Retry
      </button>
    ),
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalContent={modalContent} />
  );
};

export default DeviceNotFoundModal;
