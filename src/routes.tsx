import { createBrowserRouter } from "react-router-dom";
import WelcomeScreen from "./screens/WelcomeScreen/WelcomeScreen";
import ConnectScreen from "./screens/ConnectScreen/ConnectScreen";
import HomeScreen from "./screens/HomeScreen/HomeScreen";
import DeviceScreen from "./screens/DeviceScreen/DeviceScreen";

const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomeScreen />,
  },
  {
    path: "/connect",
    element: <ConnectScreen />,
  },
  {
    path: "/home",
    element: <HomeScreen />,
  },
  {
    path: "/device",
    element: <DeviceScreen />,
  },
]);

export default router;