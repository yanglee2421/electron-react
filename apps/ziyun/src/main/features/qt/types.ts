import type { QT } from "./qt";

export interface SetupAppInput {
  qtAppPath: string;
  qtDataDirectory: string;
}

export interface SetYiqiConfigLibInput {
  id: number;
  lib: string;
}

export interface Fetch502DateInput {
  ids: string[];
  user: string;
  zx: string;
  date: string;
}

export interface QTCHR53AInput {
  user: string;
  date: string;
  ids: string[];
}

export interface FetchDetectionsInput {
  date: string;
  user: string;
  zx: string;
  zh: string;
  result: string;
  pageIndex: number;
  pageSize: number;
}

export interface FetchQTVerifiesInput {
  date: string;
  user: string;
  zx: string;
  pageIndex: number;
  pageSize: number;
}

export interface FetchQuartorsInput {
  date: string;
  user: string;
  zx: string;
  pageIndex: number;
  pageSize: number;
}

export interface AnniversaryInput {
  pageIndex: number;
  pageSize: number;
}

export interface IPC {
  "qt/detections": {
    args: [FetchDetectionsInput];
    return: ReturnType<QT["fetchDetections"]>;
  };
  "qt/verifies": {
    args: [FetchQTVerifiesInput];
    return: ReturnType<QT["fetchVerifies"]>;
  };
  "qt/quartors": {
    args: [FetchQuartorsInput];
    return: ReturnType<QT["fetchQuartors"]>;
  };
  "qt/anniversary": {
    args: [AnniversaryInput];
    return: ReturnType<QT["anniversary"]>;
  };
  "qt/anniversary-detail": {
    args: [string];
    return: ReturnType<QT["anniversaryDetail"]>;
  };

  "qt/users": {
    args: [];
    return: ReturnType<QT["fetchUsers"]>;
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
  "qt/52a": {
    args: [string];
    return: ReturnType<QT["fetch52AData"]>;
  };
  "qt/53a": {
    args: [QTCHR53AInput];
    return: ReturnType<QT["fetch53AData"]>;
  };

  "qt/setup-app": {
    args: [SetupAppInput];
    return: ReturnType<QT["setupApp"]>;
  };
  "qt/start-app": {
    args: [];
    return: ReturnType<QT["startApp"]>;
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
}
