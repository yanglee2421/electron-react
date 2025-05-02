/**
 * Renderer scripts entry point
 * Renderer scripts run in renderer process
 * all electron modules are not available in this file
 * include:
 * 1. electron/main
 * 2. electron/renderer
 * 3. electron/common
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
