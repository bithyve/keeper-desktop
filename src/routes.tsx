import { createBrowserRouter } from "react-router-dom";
import WelcomeScreen from "./screens/WelcomeScreen/WelcomeScreen";
import ConnectScreen from "./screens/ConnectScreen/ConnectScreen";

const router = createBrowserRouter([
  {
    path: '/',
    element: <WelcomeScreen />,
  },
  {
    path: "/connect",
    element: <ConnectScreen />,
  },
]);

export default router;