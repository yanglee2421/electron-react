import * as pdf from "#renderer/api/pdf";
import dayjs from "dayjs";
import "dayjs/locale/zh";
import { enableMapSet } from "immer";
import React from "react";
import { createRoot } from "react-dom/client";
import * as z from "zod";
import { zhCN } from "zod/locales";
import { App } from "./App";

const main = async () => {
  dayjs.locale("zh");
  enableMapSet();
  z.config(zhCN());
  pdf.prepareModule();

  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root container not found");
  }

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  return root;
};

void main().catch((error) => {
  console.error("Error in main:", error);
});
