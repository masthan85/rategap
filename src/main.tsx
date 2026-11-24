import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import "./index.css";
import { StoreProvider } from "./store/store";
import { AppShell } from "./components/AppShell";
import { Onboarding } from "./pages/Onboarding";
import { HomePage } from "./pages/Home";
import { RatesPage } from "./pages/Rates";
import { MoneyPage } from "./pages/Money";
import { IsasPage } from "./pages/Isas";
import { AlertsPage } from "./pages/Alerts";

const router = createHashRouter([
  { path: "/welcome", element: <Onboarding /> },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "rates", element: <RatesPage /> },
      { path: "money", element: <MoneyPage /> },
      { path: "isas", element: <IsasPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "*", element: <HomePage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </StrictMode>,
);
