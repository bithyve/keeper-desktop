import keeperLogo from "../../assets/keeper-logo.png";
import bithyveLogo from "../../assets/bithyve-logo.svg";
import styles from "./WelcomeScreen.module.css";
import { Link } from "react-router-dom";

const WelcomeScreen = () => {
  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.content}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <p className={styles.tagline}>Secure Today, Plan for Tomorrow</p>
        <Link to="/connect" replace={true}>
          <button className={styles.btn}>Get Started</button>
        </Link>
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
