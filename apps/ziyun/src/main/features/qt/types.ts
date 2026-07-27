import type { QT } from "./qt";

export interface SetupAppInput {
  qtAppPath: string;
  qtDataDirectory: string;
}

export interface IPC {
  "qt/anniversary": {
    args: [];
    return: ReturnType<QT["anniversary"]>;
  };
  "qt/anniversary-detail": {
    args: [string];
    return: ReturnType<QT["anniversaryDetail"]>;
  };
  "qt/503": {
    args: [string];
    return: ReturnType<QT["fetch503Data"]>;
  };
  "qt/501": {
    args: [string];
    return: ReturnType<QT["fetch501Data"]>;
  };
  "qt/setup-app": {
    args: [SetupAppInput];
    return: ReturnType<QT["setupApp"]>;
  };
}
