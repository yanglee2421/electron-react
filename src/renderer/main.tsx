/**
 * Renderer Process Entry Point
 *
 * This file serves as the entry point for all renderer process scripts.
 * Note that Electron modules are not accessible from the renderer process.
 *
 * Unavailable modules include:
 * - electron/main
 * - electron/renderer
 * - electron/common
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
