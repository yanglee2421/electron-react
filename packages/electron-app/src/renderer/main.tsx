import * as pdf from "#renderer/api/pdf";
import dayjs from "dayjs";
import "dayjs/locale/zh";
import { enableMapSet } from "immer";
import React from "react";
import { createRoot } from "react-dom/client";
import * as z from "zod";
import { zhCN } from "zod/locales";
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
