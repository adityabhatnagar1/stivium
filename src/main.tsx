import "./assets/main.css";
import "./assets/interactions.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installTauriBridge } from "./tauri/bridge";
import App from "./App";

installTauriBridge();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
