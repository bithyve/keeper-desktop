import { invoke } from "@tauri-apps/api/tauri";

async function getEnvironment() {
  try {
    const environment = await invoke<string>("get_environment");
    return environment;
  } catch (error) {
    console.error("Failed to get environment:", error);
    return "dev"; // Default to dev if there's an error
  }
}

async function getConfig() {
  const environment = await getEnvironment();
  const config = environment === "prod" ? prodConfig : devConfig;
  return config;
}

const devConfig = {
  subscriptions: {
    btcPayUrl:
      "https://btcpay0.voltageapp.io/apps/3REVa49pm5EwCt6nArFztmHKzd7L/pos",
    notificationUrl: "https://3s8w8vjf-3000.inc1.devtunnels.ms/btcPayServer",
  },
};

const prodConfig = {
  subscriptions: {
    btcPayUrl:
      "https://btcpay0.voltageapp.io/apps/3REVa49pm5EwCt6nArFztmHKzd7L/pos",
    notificationUrl: "https://your-production-url.com/btcPayServer",
  },
};

const config = await getConfig();

export default config;
