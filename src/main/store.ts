import Store from "electron-store";
import { BrowserWindow, nativeTheme } from "electron";
import { ipcHandle } from "./lib";
import { channel } from "./channel";
import type * as PRELOAD from "~/index";

export type Settings = {
  driverPath: string;
  alwaysOnTop: boolean;
  mode: "system" | "light" | "dark";
};

export const settings = new Store<Settings>({
  name: "settings",
  schema: {
    driverPath: {
      type: "string",
      default: "",
    },
    alwaysOnTop: {
      type: "boolean",
      default: false,
    },
    mode: {
      type: "string",
      default: "system",
      enum: ["system", "light", "dark"],
    },
  },
});

export type HXZY_HMIS = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  gd: string;
};

export const hxzy_hmis = new Store<HXZY_HMIS>({
  name: "hxzy_hmis",
  schema: {
    host: {
      type: "string",
      default: "",
    },
    autoInput: {
      type: "boolean",
      default: false,
    },
    autoUpload: {
      type: "boolean",
      default: false,
    },
    autoUploadInterval: {
      type: "number",
      default: 30,
    },
    gd: {
      type: "string",
      default: "",
    },
  },
});

export type JTV_HMIS_XUZHOUBEI = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  username_prefix: string;
};

export const jtv_hmis_xuzhoubei = new Store<JTV_HMIS_XUZHOUBEI>({
  name: "jtv_hmis_xuzhoubei",
  schema: {
    host: {
      type: "string",
      default: "",
    },
    autoInput: {
      type: "boolean",
      default: false,
    },
    autoUpload: {
      type: "boolean",
      default: false,
    },
    autoUploadInterval: {
      type: "number",
      default: 30,
    },
    username_prefix: {
      type: "string",
      default: "",
    },
  },
});

export type JTV_HMIS = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  unitCode: string;
};

export const jtv_hmis = new Store<JTV_HMIS>({
  name: "jtv_hmis",
  schema: {
    host: {
      type: "string",
      default: "",
    },
    autoInput: {
      type: "boolean",
      default: false,
    },
    autoUpload: {
      type: "boolean",
      default: false,
    },
    autoUploadInterval: {
      type: "number",
      default: 30,
    },
    unitCode: {
      type: "string",
      default: "",
    },
  },
});

export type KH_HMIS = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  tsgz: string;
  tszjy: string;
  tsysy: string;
};

export const kh_hmis = new Store<KH_HMIS>({
  name: "kh_hmis",
  schema: {
    host: {
      type: "string",
      default: "",
    },
    autoInput: {
      type: "boolean",
      default: false,
    },
    autoUpload: {
      type: "boolean",
      default: false,
    },
    autoUploadInterval: {
      type: "number",
      default: 30,
    },
    tsgz: {
      type: "string",
      default: "",
    },
    tszjy: {
      type: "string",
      default: "",
    },
    tsysy: {
      type: "string",
      default: "",
    },
  },
});

const initDidChange = () => {
  settings.onDidChange("alwaysOnTop", (value) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.setAlwaysOnTop(!!value);
    });
  });

  settings.onDidChange("mode", (value) => {
    if (!value) return;
    nativeTheme.themeSource = value;
  });
};

const initIpc = () => {
  ipcHandle(
    channel.settings,
    async (_, data?: PRELOAD.SetSettingParams): Promise<Settings> => {
      if (data) {
        settings.set(data);
      }
      return settings.store;
    },
  );
};

export const init = () => {
  initDidChange();
  initIpc();
};
