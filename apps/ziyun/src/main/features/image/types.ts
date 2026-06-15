export interface IPCContract {
  "MD5/MD5_BACKUP_IMAGE": {
    args: [string];
    return: void;
  };
  "MD5/MD5_COMPUTE": {
    args: [string];
    return: Record<string, string>;
  };
}
