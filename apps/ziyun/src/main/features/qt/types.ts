import type { QT } from "./qt";

export interface SetupAppInput {
  qtAppPath: string;
  qtDataDirectory: string;
}

export interface SetYiqiConfigLibInput {
  id: number;
  lib: string;
}

export interface AnniversaryInput {
  pageIndex: number;
  pageSize: number;
}

export interface Fetch502DateInput {
  in: string[];
  user: string;
  zx: string;
  date: string;
}

export interface IPC {
  "qt/anniversary": {
    args: [AnniversaryInput];
    return: ReturnType<QT["anniversary"]>;
  };
  "qt/anniversary-detail": {
    args: [string];
    return: ReturnType<QT["anniversaryDetail"]>;
  };
  "qt/501": {
    args: [string];
    return: ReturnType<QT["fetch501Data"]>;
  };
  "qt/502": {
    args: [Fetch502DateInput];
    return: ReturnType<QT["fetch502Data"]>;
  };
  "qt/503": {
    args: [string];
    return: ReturnType<QT["fetch503Data"]>;
  };
  "qt/setup-app": {
    args: [SetupAppInput];
    return: ReturnType<QT["setupApp"]>;
  };
  "qt/current-db-path": {
    args: [];
    return: ReturnType<QT["getCurrentLocalDB"]>;
  };
  "qt/yiqiConfig/list": {
    args: [];
    return: ReturnType<QT["deviceConfigList"]>;
  };
  "qt/yiqiConfig/lib": {
    args: [SetYiqiConfigLibInput];
    return: ReturnType<QT["setDeviceConfigLib"]>;
  };
  "qt/yiqiConfig/flag": {
    args: [number];
    return: ReturnType<QT["setDeviceConfigFlag"]>;
  };
  "qt/start-app": {
    args: [];
    return: ReturnType<QT["startApp"]>;
  };
  "qt/quartors": {
    args: [];
    return: ReturnType<QT["fetchQuartors"]>;
  };
}
