import BaseModal from '../BaseModal/BaseModal';
import { deviceContent, HWI_ACTION, HWI_DEVICES, HWIDevice, HWIDeviceType } from "../../helpers/devices";
import styles from './DeviceActionModal.module.css';
import baseStyles from "../BaseModal/BaseModal.module.css";
import loader from '../../assets/loader.svg';
import verifyAddressIcon from '../../assets/verify-address-icon.svg';
import { useDeviceActions } from '../../hooks/useDeviceActions';

interface DeviceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: HWIDeviceType;
  actionType: HWI_ACTION;
  psbt: string | null;
  descriptor: string | null;
  expectedAddress: string | null;
  onConnectResult: (devices: HWIDevice[]) => void;
  onActionSuccess: () => void;
  onError: (error: string) => void;
}

const actionTitle = (deviceType: HWIDeviceType) => ({
  connect: `Connect ${HWI_DEVICES[deviceType].name}`,
  shareXpubs: `Setting up ${HWI_DEVICES[deviceType].name}`,
  healthCheck: `${HWI_DEVICES[deviceType].name} Health Check`,
  signTx: "Sign Transaction",
  registerMultisig: `Register Multisig on ${HWI_DEVICES[deviceType].name}`,
  verifyAddress: `Verify Address on your ${HWI_DEVICES[deviceType].name}`,
});

const DeviceActionModal = ({
  isOpen,
  onClose,
  deviceType,
  actionType,
  psbt,
  descriptor,
  expectedAddress,
  onConnectResult,
  onActionSuccess,
  onError,
}: DeviceActionModalProps) => {
  const { isLoading, handleContinue } = useDeviceActions({
    deviceType,
    actionType,
    psbt,
    descriptor,
    expectedAddress,
    onConnectResult,
    onActionSuccess,
    onError,
  });

  const content = deviceContent[deviceType];
  const hasListItems = content.content[actionType].list.length > 0;

  const isVerifyAddress = actionType === "verifyAddress";
  const iconSrc = isVerifyAddress ? verifyAddressIcon : content.icon;
  const iconStyle = isVerifyAddress ? { width: '203px', height: '157px' } : {};

  const modalContent = {
    image: (
      <img
        src={iconSrc}
        alt={`${deviceType} icon`}
        className={`${baseStyles.icon} ${styles.icon}`}
        style={iconStyle}
      />
    ),
    title: (
      <h2
        className={`${baseStyles.title} ${styles.title}`}
        style={{
          textAlign: hasListItems ? "left" : "center",
          marginLeft: hasListItems ? "25px" : "7%",
        }}
      >
        {actionTitle(deviceType)[actionType]}
      </h2>
    ),
    content: (
      <p
        className={`${baseStyles.text} ${styles.text}`}
        style={{
          textAlign: hasListItems ? "left" : "center",
          marginLeft: hasListItems ? "25px" : "7%",
        }}
      >
        {content.content[actionType].text}
        <ul>
          {content.content[actionType].list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </p>
    ),
    button: (
      <button
        className={`${baseStyles.continueButton} ${styles.continueButton}`}
        onClick={handleContinue}
        disabled={isLoading}
      >
        {isLoading ? (
          <img
            src={loader}
            alt="Loading..."
            className={styles.loadingSpinner}
          />
        ) : (
          "Continue"
        )}
      </button>
    ),
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      modalContent={modalContent}
    />
  );
};

export default DeviceActionModal;
