import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import keeperLogo from "../../assets/keeper-logo.png";
import bithyveLogo from "../../assets/bithyve-logo.svg";
import styles from "./WelcomeScreen.module.css";
import { Link } from "react-router-dom";
import loader from "../../assets/loader.svg";

const WelcomeScreen = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    console.log("Checking connection");
    checkConnection();

    const unsubscribe = listen("app-ready", async () => {
      await checkConnection();
    });

    return () => {
      unsubscribe.then((f) => f());
    };
  }, []);

  const checkConnection = async () => {
    try {
      const clientStatus = await invoke<boolean>("check_client_status");
      setIsConnected(clientStatus);
    } catch {
      setIsConnected(false);
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      setIsConnected(await invoke<boolean>("reconnect_channel"));
    } catch {
      setIsConnected(false);
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.content}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <p className={styles.tagline}>Secure Today, Plan for Tomorrow</p>
        {isConnected ? (
          <Link to="/connect" replace={true}>
            <button className={styles.btn}>Get Started</button>
          </Link>
        ) : (
          <>
            {!isReconnecting && (
              <p className={styles.errorMessage}>
                Failed to establish connection with the Keeper server. Please
                try again or contact support if the issue persists.
              </p>
            )}
            <button
              className={`${styles.btn} ${styles.reconnect}`}
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <img
                  src={loader}
                  alt="Reconnecting..."
                  className={styles.loadingSpinner}
                />
              ) : (
                "Reconnect"
              )}
            </button>
          </>
        )}
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
