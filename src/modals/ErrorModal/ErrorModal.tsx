import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import styles from "./ErrorModal.module.css";
import baseStyles from "../BaseModal/BaseModal.module.css";
import DeviceErrorIcon from "../../assets/device-not-found-icon.svg";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  onRetry: () => void;
}

const ErrorModal = ({
  isOpen,
  onClose,
  errorMessage,
  onRetry,
}: ErrorModalProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shortMessage =
    errorMessage.length > 100
      ? errorMessage.slice(0, 100) + "..."
      : errorMessage;

  const modalContent = {
    image: (
      <img
        src={DeviceErrorIcon}
        alt="Error"
        className={`${baseStyles.icon} ${styles.icon}`}
      />
    ),
    title: (
      <h2 className={`${baseStyles.title} ${styles.title}`}>
        An Error Occurred
      </h2>
    ),
    content: (
      <>
        <div className={styles.errorMessageContainer}>
          {isExpanded ? (
            <div className={styles.expandedError}>
              <p className={styles.errorMessage}>{errorMessage}</p>
            </div>
          ) : (
            <p className={styles.errorMessage}>{shortMessage}</p>
          )}
          {errorMessage.length > 100 && (
            <button
              className={styles.expandButton}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
        <p className={`${baseStyles.text} ${styles.text}`}>
          Please try again. If the issue persists, contact support.
        </p>
      </>
    ),
    button: (
      <div className={styles.buttonContainer}>
        <button
          className={`${baseStyles.continueButton} ${styles.retryButton}`}
          onClick={onRetry}
        >
          Retry
        </button>
      </div>
    ),
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} modalContent={modalContent} />
  );
};

export default ErrorModal;
