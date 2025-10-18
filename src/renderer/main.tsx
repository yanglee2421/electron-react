import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { enableMapSet } from "immer";
import * as z from "zod";
import { zhCN } from "zod/locales";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

dayjs.locale("zh-cn");
z.config(zhCN());

enableMapSet();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
