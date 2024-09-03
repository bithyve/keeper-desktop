import BaseModal from "../BaseModal/BaseModal";
import styles from "./MultipleDevicesModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import MultipleDevicesIcon from "../../assets/multiple-devices-error-icon.svg";
import { HWI_DEVICES, HWIDeviceType } from "../../helpers/devices";

interface MultipleDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: HWIDeviceType;
  onContinue: () => void;
}

const MultipleDevicesModal = ({
  isOpen,
  onClose,
  deviceType,
  onContinue,
}: MultipleDevicesModalProps) => {
  const getModalContent = () => ({
    title: `Numerous Devices Connected!`,
    text: `You have multiple ${HWI_DEVICES[deviceType].name} devices connected. Please connect only the one you wish to use.`,
  });

  const { title, text } = getModalContent();

  const modalContent = {
    image: (
      <img
        src={MultipleDevicesIcon}
        alt="Numverous devices found"
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

export default MultipleDevicesModal;
