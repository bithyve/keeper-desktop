import { ReactNode } from 'react';
import styles from './BaseModal.module.css';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalContent: {
    image: ReactNode;
    title: ReactNode;
    content: ReactNode;
    button: ReactNode;
  };
}

const BaseModal = ({
  isOpen,
  onClose,
  modalContent,
}: BaseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.modalImage}>
          {modalContent.image}
        </div>
        <div className={styles.modalBody}>
          {modalContent.title}
          {modalContent.content}
        </div>
        {modalContent.button}
      </div>
    </div>
  );
};

export default BaseModal;
