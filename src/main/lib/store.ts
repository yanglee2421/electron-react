import Store from "electron-store";

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
  signature_prefix: string;
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
    signature_prefix: {
      type: "string",
      default: "W",
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

export type JTV_HMIS_Guangzhoubei = {
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  unitCode: string;
  get_host: string;
  post_host: string;
  signature_prefix: string;
};

export const jtv_hmis_guangzhoubei = new Store<JTV_HMIS_Guangzhoubei>({
  name: "jtv_hmis",
  schema: {
    get_host: {
      type: "string",
      default: "",
    },
    post_host: {
      type: "string",
      default: "",
    },
    signature_prefix: {
      type: "string",
      default: "W",
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
