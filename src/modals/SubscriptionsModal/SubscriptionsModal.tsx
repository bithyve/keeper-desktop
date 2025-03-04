import config from "../../config/config";
import styles from "./SubscriptionsModal.module.css";
import hodlerIcon from "../../assets/hodler-tier.svg";
import diamondIcon from "../../assets/diamond-hands-tier.svg";
import tickIcon from "../../assets/tick-icon.svg";
import closeIcon from "../../assets/close-btn.svg";
import { WebviewWindow } from "@tauri-apps/api/window";

interface SubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { appId?: string; roomId?: string; orderId?: string };
}

const SubscriptionsModal = ({
  isOpen,
  onClose,
  data,
}: SubscriptionsModalProps) => {
  if (!isOpen) return null;

  const openExternalForm = (productId: string) => {
    const posData = JSON.stringify({
      ...data,
      action: "PURCHASE_SUBS",
      productId,
    });

    const url = `btcpay.html?action=${encodeURIComponent(config.subscriptions.btcPayUrl)}&posData=${encodeURIComponent(posData)}&orderId=${encodeURIComponent(data.orderId || "id")}&notificationUrl=${encodeURIComponent(config.subscriptions.notificationUrl)}&choiceKey=${productId}`;

    const webview = new WebviewWindow("btcpayWindow", {
      url,
      visible: true,
      focus: true,
      resizable: true,
      title: "Keeper BTCPay",
      width: 1200,
      height: 950,
    });

    webview.once("tauri://created", () => {
      console.log("Webview window successfully created");
    });

    webview.once("tauri://error", (e) => {
      console.error("Error creating webview window", e);
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <img
          src={closeIcon}
          alt="Close"
          className={styles.closeButton}
          onClick={onClose}
        />
        <h1 className={styles.title}>Manage Subscription</h1>
        <p className={styles.subtitle}>
          Manage your subscription preferences and stay in control of your plan.
        </p>

        <div className={styles.tiersContainer}>
          {/* Hodler Tier */}
          <div className={styles.tierCard}>
            <div className={styles.tierHeader}>
              <img
                src={hodlerIcon}
                alt="Hodler tier icon"
                className={styles.tierIcon}
              />
              <div>
                <h2 className={styles.tierTitle}>
                  Hodler <span>(Intermediate)</span>
                </h2>
              </div>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>All features of Pleb +</span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>
                  Automatic encrypted backups of app data for easy recovery
                </span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>
                  Server key assisted key for easy collaborative custody
                </span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>
                  Save encrypted cloud backups to your iCloud or Google Drive
                </span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>
                  Set up Canary Wallets to detect unauthorized key access
                </span>
              </div>
            </div>

            <div className={styles.pricing}>
              <span className={styles.price}>US$ 99.99/</span>
              <span className={styles.period}>yearly</span>
            </div>

            <button
              onClick={() => openExternalForm("hodler.yearly")}
              className={styles.getStartedButton}
            >
              Get Started
            </button>
          </div>

          {/* Diamond Hands Tier */}
          <div className={styles.tierCard}>
            <div className={styles.tierHeader}>
              <img
                src={diamondIcon}
                alt="Diamond Hands tier icon"
                className={styles.tierIcon}
              />
              <div>
                <h2 className={styles.tierTitle}>
                  Diamond Hands <span>(Advanced)</span>
                </h2>
              </div>
            </div>

            <div className={styles.features}>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>All features of Hodler +</span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>
                  Create Enhanced Wallet with special Inheritance and Emergency
                  keys
                </span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>Inheritance Planning tools and documents</span>
              </div>
              <div className={styles.feature}>
                <img src={tickIcon} alt="Check" />
                <span>Onboarding call with our keeper Concierge team</span>
              </div>
            </div>

            <div className={styles.pricing}>
              <span className={styles.price}>US$ 199.99/</span>
              <span className={styles.period}>yearly</span>
            </div>

            <button
              onClick={() => openExternalForm("diamond_hands.yearly")}
              className={styles.getStartedButton}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsModal;
