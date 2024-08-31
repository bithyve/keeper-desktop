import { useState } from 'react';
import BaseModal from '../BaseModal/BaseModal';
import { deviceContent, HWI_ACTION, HWI_DEVICES, HWIDevice, HWIDeviceType } from "../../helpers/devices";
import styles from './DeviceActionModal.module.css';
import baseStyles from "../BaseModal/BaseModal.module.css";
import loader from '../../assets/loader.svg';
import hwiService from '../../services/hwiService';
import verifyAddressIcon from '../../assets/verify-address-icon.svg';

interface DeviceActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: HWIDeviceType;
  actionType: HWI_ACTION;
  psbt: string | null;
  descriptor: string | null;
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
  onConnectResult,
  onActionSuccess,
  onError,
}: DeviceActionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      switch (actionType) {
        case 'connect':
          const devices = await hwiService.fetchDevices(deviceType);
          onConnectResult(devices);
          break;
        case 'shareXpubs':
          await hwiService.shareXpubs();
          onActionSuccess();
          break;
        case 'healthCheck':
          await hwiService.performHealthCheck();
          onActionSuccess();
          break;
        case 'signTx':
          if (!psbt) {
            onError('PSBT is required');
            return;
          }
          await hwiService.signTx(psbt);
          onActionSuccess();
          break;
        case 'registerMultisig':
          if (!descriptor) {
            onError('Descriptor is required');
            return;
          }
          await hwiService.registerMultisig(descriptor);
          onActionSuccess();
          break;
        case 'verifyAddress':
          if (!descriptor) {
            onError("Descriptor is required");
            return;
          }
          await hwiService.verifyAddress(descriptor);
          onActionSuccess();
          break;
        default:
          throw new Error('Unsupported action type');
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
      onError((error as any).toString());
    } finally {
      setIsLoading(false);
    }
  };

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
          marginLeft: hasListItems ? "25px" : "0",
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
          marginLeft: hasListItems ? "25px" : "0",
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
