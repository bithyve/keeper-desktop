import styles from "./ConnectScreen.module.css";
import keeperLogo from "../../assets/keeper-logo.png";
import instructionsIcon from "../../assets/instructions-icon.svg";

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import QRCode from 'qrcode.react';

const ConnectScreen = () => {
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    const setupChannel = async () => {    
      const channelSecret = await invoke<string>('generate_encryption_key');
      setQrData(channelSecret);
    };

    setupChannel();

    // Listen for SET_NETWORK event
    const unsubscribe = listen('channel-message', (channelMessage: any) => {
      const { event, data } = channelMessage.payload;
      if (event === 'SET_NETWORK' && data[0].network) {
        const network = data[0].network === 'TESTNET' ? 'TESTNET' : 'MAINNET';
        console.log(`Network set to: ${network}`);
        // TODO: Implement navigation to home screen with network type
      }
    });

    return () => {
      unsubscribe.then(f => f());
    };
  }, []);

  return (
    <div className={styles.connectScreen}>
      <div className={styles.leftSection}>
        <img src={keeperLogo} alt="Keeper Logo" className={styles.keeperLogo} />
        <h1 className={styles.title}>Welcome to Keeper Desktop App</h1>
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionsTitle}>
            <img src={instructionsIcon} className={styles.instructionsIcon} alt="" />
            Instructions:
          </h3>
          <ul className={styles.instructionsList}>
            <li>From the keeper app, open QR scanner and Scan this app</li>
            <li>You can use this for adding a device, registering a vault, or to sign transactions</li>
            <li>You will need a new QR for each operation you perform, by just refreshing</li>
          </ul>
        </div>
        <div className={styles.note}>
          <h4>Note:</h4>
          <p>This QR will get you the key to Decrypt the data from this Keeper Web Interface to make communication E2R encrypted</p>
        </div>
      </div>
      <div className={styles.qrContainer}>
        <div className={styles.qrCode}>
          <QRCode value={qrData} size={200} bgColor="#2d6759" fgColor="#fff" />
          <p className={styles.scanMe}>Scan Me</p>
        </div>
        <p className={styles.qrNote}>
          Make sure No one is around you when you scan this. You can always refresh to get fresh key session
        </p>
      </div>
    </div>
  );
};

export default ConnectScreen;