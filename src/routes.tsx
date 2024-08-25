import { createBrowserRouter } from "react-router-dom";
import WelcomeScreen from "./screens/WelcomeScreen/WelcomeScreen";
import ConnectScreen from "./screens/ConnectScreen/ConnectScreen";
import HomeScreen from "./screens/HomeScreen/HomeScreen";

const router = createBrowserRouter([
  {
    path: '/',
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
]);

export default router;