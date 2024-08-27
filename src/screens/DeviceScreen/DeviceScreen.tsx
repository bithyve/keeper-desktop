import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./DeviceScreen.module.css";
import keeperLogo from "../../assets/keeper-logo.png";
import healthCheckIcon from "../../assets/health-check-icon.svg";
import shareXpubIcon from "../../assets/share-xpub-icon.svg";
import registerMultiSigIcon from "../../assets/register-multisig-icon.svg";
import { HWI_DEVICES, HWIDevice } from "../../helpers/devices";
import hwiService from "../../services/hwiService";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";

const DeviceScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleAction = async (action: () => Promise<string>, message: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      await action();
    } catch (error) {
      console.error("Device communication error:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareXpubs = () => handleAction(hwiService.shareXpubs, "Sharing xPub...");
  const handleHealthCheck = () => handleAction(hwiService.performHealthCheck, "Performing health check...");

  const location = useLocation();
  const device = location.state?.device as HWIDevice;

  if (!device) {
    // Handle case where device info is not available
    return <div>Device information not found</div>;
  }

  return (
    <div className={styles.deviceScreen}>
      <header className={styles.header}>
        <img src={keeperLogo} alt="Keeper" className={styles.logo} />
        <button className={styles.closeButton}>×</button>
      </header>
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Link to="/home" replace={true} className={styles.backLink}>
            &lt; Back
          </Link>
          <section className={styles.deviceInfo}>
            <div className={styles.deviceCard}>
              <img
                src={HWI_DEVICES[device.device_type].iconWhite}
                alt={device.device_type}
                className={styles.deviceIcon}
              />
              <div className={styles.deviceCardContent}>
                <div className={styles.deviceText}>
                  <h2>{device.device_type}</h2>
                  <p>XFP: {device.fingerprint.toUpperCase()}</p>
                </div>
                <button className={styles.signTransactionButton}>
                  Sign Transaction
                </button>
              </div>
            </div>
          </section>
          <section className={styles.deviceActions}>
            <div className={styles.actionsContainer}>
              <p className={styles.actionsInstructions}>
                Please choose an option as instructed in Bitcoin Keeper App
              </p>
              <div className={styles.actionCards}>
                {isLoading && <LoadingSpinner message={loadingMessage} />}
                {!isLoading && (
                  <>
                    <div
                      className={styles.actionCard}
                      onClick={handleHealthCheck}
                    >
                      <img
                        src={healthCheckIcon}
                        alt="Health Check"
                        className={styles.actionIcon}
                      />
                      <div className={styles.actionContent}>
                        <h3>Health Check</h3>
                        <p className={styles.actionSubtitle}>
                          Latest Health Check
                        </p>
                        <p className={styles.actionDate}>8 August 2024</p>
                      </div>
                    </div>
                    <div
                      className={styles.actionCard}
                      onClick={handleShareXpubs}
                    >
                      <img
                        src={shareXpubIcon}
                        alt="Share xPub"
                        className={styles.actionIcon}
                      />
                      <div className={styles.actionContent}>
                        <h3>Share xPub</h3>
                      </div>
                    </div>
                    {HWI_DEVICES[device.device_type].register_multisig && (
                      <div className={styles.actionCard}>
                        <img
                          src={registerMultiSigIcon}
                          alt="Register Multi-sig"
                          className={styles.actionIcon}
                        />
                        <div className={styles.actionContent}>
                          <h3>Register Multi-sig</h3>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DeviceScreen;
