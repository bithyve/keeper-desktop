import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import styles from "./TrezorPinModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import loader from "../../assets/loader.svg";
import TrezorIcon from "../../assets/hww/icons-modal/trezor.svg";
import ErrorIcon from "../../assets/error-popup-icon.svg";
import hwiService from "../../services/hwiService";
import { NetworkType } from "../../helpers/devices";

interface TrezorPinModalProps {
  isOpen: boolean;
  network: NetworkType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TrezorPinModal = ({
  isOpen,
  network,
  onClose,
  onSuccess,
}: TrezorPinModalProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePinClick = (value: string) => {
    setPin((prevPin) => prevPin + value);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      return showError("PIN must be at least 4 digits");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsLoading(true);
    try {
      await hwiService.sendPin(pin);
      const devices = await hwiService.fetchDevices(
        "trezor",
        network?.toLowerCase(),
      );
      await hwiService.setHWIClient(
        devices[0].fingerprint,
        "trezor",
        network!.toLowerCase(),
      );
      onSuccess();
    } catch {
      // TODO: Show exact error
      await hwiService.promptPin();
      return showError("Wrong PIN entered");
    } finally {
      setIsLoading(false);
    }
  };

  function showError(error: string) {
    setError(error);
    setPin("");
    const timer = setTimeout(() => {
      setError("");
    }, 4000);
    return () => clearTimeout(timer);
  }

  const modalContent = {
    image: (
      <img
        src={TrezorIcon}
        alt="Trezor"
        className={`${baseStyles.icon} ${styles.icon}`}
      />
    ),
    title: (
      <h2 className={`${baseStyles.title} ${styles.title}`}>Enter the pin</h2>
    ),
    content: (
      <>
        <div className={`${styles.errorContainer} ${error ? styles.show : ""}`}>
          <div className={styles.error}>
            <img src={ErrorIcon} alt="Error" className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        </div>
        <div className={styles.textContainer}>
          <p className={`${baseStyles.text} ${styles.text}`}>
            Follow the keypad layout on your Trezor
          </p>
        </div>
        <div className={styles.pinPadContainer}>
          <div className={styles.pinPad}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => handlePinClick(num.toString())}
                className={styles.pinButton}
              />
            ))}
          </div>
        </div>
      </>
    ),
    button: (
      <button
        disabled={isLoading}
        onClick={handlePinSubmit}
        className={`${baseStyles.continueButton} ${styles.submitButton}`}
      >
        {isLoading ? (
          <img
            src={loader}
            alt="Loading..."
            className={styles.loadingSpinner}
          />
        ) : (
          "Enter Pin"
        )}
      </button>
    ),
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalContent={modalContent} />
  );
};

export default TrezorPinModal;
