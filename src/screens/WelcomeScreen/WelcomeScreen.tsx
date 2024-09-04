import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Link } from "react-router-dom";
import keeperLogo from "../../assets/keeper-logo.png";
import bithyveLogo from "../../assets/bithyve-logo.svg";
import loader from "../../assets/loader.svg";
import styles from "./WelcomeScreen.module.css";

const WelcomeScreen = () => {
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "failed"
  >("connecting");
  const [circleExpanded, setCircleExpanded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [slowContentVisible, setSlowContentVisible] = useState(false);

  const connectChannel = useCallback(async () => {
    try {
      const connected = await invoke<boolean>("connect_channel");
      setConnectionState(connected ? "connected" : "failed");
    } catch {
      setConnectionState("failed");
    }
  }, []);

  useEffect(() => {
    setCircleExpanded(false);
    setSlowContentVisible(false);
    setContentVisible(false);
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
    connectChannel();
  };

  return (
    <div
      className={`${styles.welcomeScreen} ${circleExpanded ? styles.circleExpanded : ""}`}
    >
      <div className={styles.circle}></div>
      <div
        className={`${styles.content} ${contentVisible ? styles.contentVisible : ""}`}
      >
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <p className={styles.tagline}>Secure Today, Plan for Tomorrow</p>
        <div className={styles.dynamicContent}>
          {connectionState === "connecting" && (
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
          {connectionState === "failed" && (
            <>
              <p
                className={`${styles.errorMessage} ${slowContentVisible ? styles.slowVisible : ""}`}
              >
                Failed to establish connection with the Keeper server. Please
                try again or contact support if the issue persists.
              </p>
              <button
                className={`${styles.btn} ${styles.reconnect} ${slowContentVisible ? styles.slowVisible : ""}`}
                onClick={handleReconnect}
              >
                Reconnect
              </button>
            </>
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
