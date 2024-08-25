import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import styles from './HomeScreen.module.css';
import keeperLogo from '../../assets/keeper-logo.png';
import bitcoinIcon from '../../assets/bitcoin-icon.svg';
import DeviceItem from '../../components/DeviceItem/DeviceItem';
import { Link } from "react-router-dom";
import { Device } from '../../helpers/devices';


const HomeScreen = () => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const fetchedDevices = await invoke<Device[]>('get_devices');
      setDevices(fetchedDevices);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  return (
    <div className={styles.homeScreen}>
      <header className={styles.header}>
        <img src={keeperLogo} alt="Keeper" className={styles.logo} />
        <button className={styles.closeButton}>×</button>
      </header>
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Link to="/connect" replace={true}>
            <a href="#" className={styles.backLink}>
              &lt; Back to Home
            </a>
          </Link>
          <section className={styles.btcFeeRates}>
            <h2>Live BTC Fee Rates</h2>
            <div className={styles.rateContent}>
              <div className={styles.rateInfo}>
                <div className={styles.rateIndicator}>
                  <span className={styles.triangle}>▼</span>
                </div>
                <div className={styles.rateValues}>
                  <span className={styles.rateValue}>25.0</span>
                  <span className={styles.rateUnit}>Sats/vb</span>
                </div>
              </div>
              <div className={styles.chartPlaceholder}></div>
            </div>
            <div className={styles.rateFooter}>
              <span className={styles.weekAverage}>
                <span className={styles.dot}></span> Week Average is&nbsp;
                <span className={styles.weekAverageValue}>32 Sats/vb</span>
              </span>
              <span className={styles.btcValue}>
                <img
                  src={bitcoinIcon}
                  alt="Bitcoin"
                  className={styles.bitcoinIcon}
                />{" "}
                $66,652.80
              </span>
            </div>
          </section>
          <section className={styles.deviceConnect}>
            <h2>Pick or Connect your Device</h2>
            <p>You can create a wallet using any hardware key</p>
            <div className={styles.deviceList}>
              {devices.map((device) => (
                <DeviceItem key={device.xfp} device={device} />
              ))}
              {devices.length === 0 && (
                <div className={styles.noDevices}>
                  <h3>No devices found...</h3>
                  <p>Please connect your device click on Refresh.</p>
                </div>
              )}
            </div>
            <button className={styles.refreshButton} onClick={fetchDevices}>
              <span className={styles.refreshIcon}>↻</span> Refresh
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;