import { Link } from "react-router-dom";
import { HWIDevice, HWI_DEVICES } from "../../helpers/devices";
import styles from "./DeviceItem.module.css";

interface DeviceItemProps {
  device: HWIDevice;
}

const DeviceItem = ({ device }: DeviceItemProps) => {
  return (
    <Link to={`/device`} className={styles.deviceLink}>
      <div className={styles.deviceItem}>
        <img
          src={HWI_DEVICES[device.device_type].icon}
          alt={HWI_DEVICES[device.device_type].name}
          className={styles.deviceIcon}
        />
        <div className={styles.deviceInfo}>
          <h3>{HWI_DEVICES[device.device_type].name}</h3>
          <p>XFP: {device.fingerprint.toUpperCase()}</p>
        </div>
      </div>
    </Link>
  );
};

export default DeviceItem;