import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import styles from "./TrezorPinModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import TrezorIcon from "../../assets/hww/icons-modal/trezor.svg";
import hwiService from "../../services/hwiService";

interface TrezorPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TrezorPinModal = ({ isOpen, onClose, onSuccess }: TrezorPinModalProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePinClick = (value: string) => {
    setPin((prevPin) => prevPin + value);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    console.log("pin", pin);
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      await hwiService.sendPin(pin);
      onSuccess();
    } catch (error) {
      setError("Enter PIN failed");
    }
  };

  const modalContent = {
    image: <img src={TrezorIcon} alt="Trezor" className={styles.icon} />,
    title: <h2 className={baseStyles.title}>Enter the pin</h2>,
    content: (
      <>
        <p className={baseStyles.text}>
          Follow the keypad layout on your Trezor
        </p>
        <div className={styles.pinPad}>
          {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handlePinClick(num.toString())}
              className={styles.pinButton}
            >
              •
            </button>
          ))}
        </div>
        <input
          type="password"
          value={pin}
          readOnly
          className={styles.pinInput}
        />
        {error && <p className={styles.error}>{error}</p>}
      </>
    ),
    button: (
      <button
        onClick={handlePinSubmit}
        className={`${baseStyles.continueButton} ${styles.submitButton}`}
      >
        Enter Pin
      </button>
    ),
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalContent={modalContent} />
  );
};

export default TrezorPinModal;
