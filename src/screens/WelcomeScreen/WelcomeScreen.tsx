import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Link } from "react-router-dom";
import keeperLogo from "../../assets/keeper-logo.svg";
import bithyveLogo from "../../assets/bithyve-logo.svg";
import loader from "../../assets/loader.svg";
import styles from "./WelcomeScreen.module.css";
import errorIcon from "../../assets/error-popup-icon.svg";

const WelcomeScreen = () => {
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "failed"
  >("connecting");
  const [circleExpanded, setCircleExpanded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [slowContentVisible, setSlowContentVisible] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const connectChannel = useCallback(async () => {
    try {
      const connected = await invoke<boolean>("connect_channel");
      setConnectionState(connected ? "connected" : "failed");
      if (!connected) {
        setShowErrorToast(true);
      }
    } catch {
      setConnectionState("failed");
      setShowErrorToast(true);
    }
  }, []);

  useEffect(() => {
    setCircleExpanded(false);
    setSlowContentVisible(false);
    setContentVisible(false);
    setShowErrorToast(false);
    connectChannel();

    const circleTimeout = setTimeout(() => {
      setCircleExpanded(true);
    }, 500);

    const contentTimeout = setTimeout(() => {
      setContentVisible(true);
    }, 1000);

    const buttonTimeout = setTimeout(() => {
      setSlowContentVisible(true);
    }, 3500);

    return () => {
      clearTimeout(circleTimeout);
      clearTimeout(contentTimeout);
      clearTimeout(buttonTimeout);
    };
  }, [connectChannel]);

  const handleReconnect = () => {
    setConnectionState("connecting");
    setShowErrorToast(false);
    connectChannel();
  };

  const handleTryAgain = () => {
    setShowErrorToast(false);
    setConnectionState("failed");
  };

  return (
    <div
      className={`${styles.welcomeScreen} ${circleExpanded ? styles.circleExpanded : ""}`}
    >
      <div className={styles.circle}></div>
      {showErrorToast && (
        <div
          className={`${styles.errorToast} ${slowContentVisible ? styles.slowVisible : ""}`}
        >
          <img src={errorIcon} alt="Error" className={styles.errorIcon} />
          <div className={styles.errorMessage}>
            <h3>Server Error</h3>
            <p>
              Failed to establish connection with Keeper server.
              <br />
              Please try again or contact support if issue persists.
            </p>
          </div>
          <button onClick={handleTryAgain}>Try again</button>
        </div>
      )}
      <div
        className={`${styles.content} ${contentVisible ? styles.contentVisible : ""}`}
      >
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <p className={styles.tagline}>Secure today, plan for tomorrow</p>
        <div className={styles.dynamicContent}>
          {(connectionState === "connecting" ||
            (connectionState === "failed" && showErrorToast)) && (
            <img
              src={loader}
              alt="Connecting..."
              className={`${styles.loadingSpinner} ${slowContentVisible ? styles.slowVisible : ""}`}
            />
          )}
          {connectionState === "connected" && (
            <Link to="/connect" replace={true}>
              <button
                className={`${styles.btn} ${slowContentVisible ? styles.slowVisible : ""}`}
              >
                Get Started
              </button>
            </Link>
          )}
          {connectionState === "failed" && !showErrorToast && (
            <button
              className={`${styles.btn} ${styles.reconnect} ${slowContentVisible ? styles.slowVisible : ""}`}
              onClick={handleReconnect}
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        From the team at
        <span className={styles.bithyveSymbol}>
          <img
            src={bithyveLogo}
            alt="BitHyve Logo"
            className={styles.bithyveLogo}
          />
          Bit<span className={styles.hyve}>Hyve</span>
        </span>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
