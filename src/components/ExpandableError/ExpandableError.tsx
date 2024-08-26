import { useState, useMemo } from "react";
import styles from "./ExpandableError.module.css";

interface ExpandableErrorProps {
  message: string;
  maxLength?: number;
}

const ExpandableError = ({
  message,
  maxLength = 100,
}: ExpandableErrorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { shortMessage, needsExpansion } = useMemo(() => {
    if (message.length <= maxLength) {
      return { shortMessage: message, needsExpansion: false };
    }
    const short = message.substring(0, maxLength).trim() + "...";
    return { shortMessage: short, needsExpansion: true };
  }, [message, maxLength]);

  return (
    <div className={styles.errorContainer}>
      <p className={styles.errorMessage}>
        {isExpanded ? message : shortMessage}
      </p>
      {needsExpansion && (
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};

export default ExpandableError;
