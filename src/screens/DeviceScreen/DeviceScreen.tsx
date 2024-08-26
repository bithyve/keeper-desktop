import { Link } from "react-router-dom";
import styles from "./DeviceScreen.module.css";
import keeperLogo from "../../assets/keeper-logo.png";
import ledgerIcon from "../../assets/hww/ledger.svg";
import healthCheckIcon from "../../assets/health-check-icon.svg";
import shareXpubIcon from "../../assets/share-xpub-icon.svg";
import registerMultiSigIcon from "../../assets/register-multisig-icon.svg"; // Add this new icon

const DeviceScreen = () => {
  return (
    <div className={styles.deviceScreen}>
      <header className={styles.header}>
        <img src={keeperLogo} alt="Keeper" className={styles.logo} />
        <button className={styles.closeButton}>×</button>
      </header>
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Link to="/home" className={styles.backLink}>
            &lt; Back
          </Link>
          <section className={styles.deviceInfo}>
            <div className={styles.deviceCard}>
              <img
                src={ledgerIcon}
                alt="Ledger"
                className={styles.deviceIcon}
              />
              <div className={styles.deviceCardContent}>
                <div className={styles.deviceText}>
                  <h2>Ledger</h2>
                  <p>XFP: 36a8cb61</p>
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
                <div className={styles.actionCard}>
                  <img
                    src={healthCheckIcon}
                    alt="Health Check"
                    className={styles.actionIcon}
                  />
                  <div className={styles.actionContent}>
                    <h3>Health Check</h3>
                    <p className={styles.actionSubtitle}>Latest Health Check</p>
                    <p className={styles.actionDate}>8 August 2024</p>
                  </div>
                </div>
                <div className={styles.actionCard}>
                  <img
                    src={shareXpubIcon}
                    alt="Share xPub"
                    className={styles.actionIcon}
                  />
                  <div className={styles.actionContent}>
                    <h3>Share xPub</h3>
                  </div>
                </div>
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
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DeviceScreen;