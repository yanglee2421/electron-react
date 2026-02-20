import "dayjs/locale/zh";
import * as z from "zod";
import dayjs from "dayjs";
import React from "react";
import { zhCN } from "zod/locales";
import { enableMapSet } from "immer";
import { createRoot } from "react-dom/client";
import * as pdf from "#renderer/api/pdf";
import { App } from "./App";

dayjs.locale("zh");
enableMapSet();
z.config(zhCN());
pdf.prepareModule();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
