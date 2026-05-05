export interface IPCContract {
  "APP/OPEN_AT_LOGIN": {
    args: [boolean?];
    return: boolean;
  };
  "APP/OPEN_DEV_TOOLS": {
    args: [];
    return: void;
  };
  "APP/OPEN_PATH": {
    args: [string];
    return: string;
  };
  "APP/MOBILE_MODE": {
    args: [boolean];
    return: boolean;
  };
  "APP/SELECT_DIRECTORY": {
    args: [];
    return: string[];
  };
  "APP/SELECT_FILE": {
    args: [Electron.FileFilter[]];
    return: string[];
  };
  "APP/SHOW_OPEN_DIALOG": {
    args: [Electron.OpenDialogOptions];
    return: string[];
  };
}
