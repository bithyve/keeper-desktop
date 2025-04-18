import { getConfig } from "../../config/config";
import styles from "./SubscriptionsModal.module.css";
import hodlerIcon from "../../assets/hodler-tier.svg";
import diamondIcon from "../../assets/diamond-hands-tier.svg";
import tickIcon from "../../assets/tick-icon.svg";
import closeIcon from "../../assets/close-btn.svg";
import { WebviewWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

interface Subscription {
  name: string;
  level: number;
  icon: string;
  isActive: boolean;
  benefits: string[];
  subTitle: string;
  productId: string;
  price: number;
}

interface SubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: { appId?: string; roomId?: string };
}

const SubscriptionsModal = ({
  isOpen,
  onClose,
  data,
}: SubscriptionsModalProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const config = await getConfig();
        const response = await fetch(`${config.relay}/getSubscriptionsDesktop`);
        if (!response.ok) {
          throw new Error("Failed to fetch subscriptions");
        }
        const data: Subscription[] = await response.json();
        setSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      setLoading(true);
      fetchSubscriptions();
    }
  }, [isOpen]);

  const openExternalForm = async (productId: string) => {
    const config = await getConfig();
    const posData = JSON.stringify({
      ...data,
      action: "PURCHASE_SUBS",
      productId,
    });

    const url = `btcpay.html?action=${encodeURIComponent(config.subscriptions.btcPayUrl)}&posData=${encodeURIComponent(posData)}&choiceKey=${productId}`;

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

  if (!isOpen) return null;

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

        {loading ? (
          <div className={styles.loader}></div>
        ) : (
          <div className={styles.tiersContainer}>
            {subscriptions.map((subscription) => (
              <div key={subscription.productId} className={styles.tierCard}>
                <div className={styles.tierHeader}>
                  <img
                    src={subscription.level === 2 ? hodlerIcon : diamondIcon}
                    alt={`${subscription.name} tier icon`}
                    className={styles.tierIcon}
                  />
                  <div>
                    <h2 className={styles.tierTitle}>
                      {subscription.name} <span>({subscription.subTitle})</span>
                    </h2>
                  </div>
                </div>

                <div className={styles.features}>
                  {subscription.benefits.map((benefit, index) => (
                    <div key={index} className={styles.feature}>
                      <img src={tickIcon} alt="Check" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.pricing}>
                  <span className={styles.price}>
                    US$ {subscription.price}/
                  </span>
                  <span className={styles.period}>yearly</span>
                </div>

                <button
                  onClick={() => openExternalForm(subscription.productId)}
                  className={styles.getStartedButton}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsModal;
