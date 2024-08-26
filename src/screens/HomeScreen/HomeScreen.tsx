import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import styles from "./HomeScreen.module.css";
import keeperLogo from "../../assets/keeper-logo.png";
import bitcoinIcon from "../../assets/bitcoin-icon.svg";
import { HWIDevice } from "../../helpers/devices";
import DeviceItem from "../../components/DeviceItem/DeviceItem";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import ExpandableError from "../../components/ExpandableError/ExpandableError";
import hwiService from "../../services/hwiService";

const formatErrorMessage = (error: Error): string => {
  if (error.toString().includes("HWI error:")) {
    const hwiErrorMessage = error.toString().split("HWI error:")[1].trim();
    return hwiErrorMessage.replace(/, \(None\)$/, "");
  }
  return error.toString();
};

const HomeScreen = () => {
  const {
    data: devices,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: refetchDevices,
  } = useQuery<HWIDevice[], Error>({
    queryKey: ["hwiDevices"],
    queryFn: hwiService.fetchDevices,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const isLoadingDevices = isLoading || isFetching;

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
              {isLoadingDevices && <LoadingSpinner />}
              {!isLoadingDevices && isError && (
                <div className={styles.noDevices}>
                  <h3>Error Occurred</h3>
                  <br />
                  <ExpandableError message={formatErrorMessage(error)} />
                  <p>
                    Please try again or contact support if the issue persists.
                  </p>
                </div>
              )}
              {!isLoadingDevices &&
                !isError &&
                devices &&
                devices.length === 0 && (
                  <div className={styles.noDevices}>
                    <h3>No devices found</h3>
                    <p>Please connect your device and click on Refresh.</p>
                  </div>
                )}
              {!isLoadingDevices &&
                !isError &&
                devices &&
                devices.map((device) => (
                  <DeviceItem key={device.fingerprint} device={device} />
                ))}
            </div>
            <button
              className={styles.refreshButton}
              onClick={() => refetchDevices()}
              disabled={isLoadingDevices}
            >
              <span className={styles.refreshIcon}>↻</span> Refresh
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
