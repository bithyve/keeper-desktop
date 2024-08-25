import { Device, DEVICES } from "../../helpers/devices";
import styles from "./DeviceItem.module.css";

interface DeviceItemProps {
  device: Device;
}

const DeviceItem = ({ device }: DeviceItemProps) => {
  return (
    <div className={styles.deviceItem}>
      <img
        src={DEVICES[device.type].icon}
        alt={DEVICES[device.type].name}
        className={styles.deviceIcon}
      />
      <div className={styles.deviceInfo}>
        <h3>{DEVICES[device.type].name}</h3>
        <p>XFP: {device.xfp.toUpperCase()}</p>
      </div>
    </div>
  );
};

export default DeviceItem;