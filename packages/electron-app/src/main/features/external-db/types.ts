import type { ExternalDB } from "./external-db";

export interface IPCContract {
  "external-db/test": {
    args: [];
    return: ReturnType<ExternalDB["test"]>;
  };
  "external-db/anniversary": {
    args: [];
    return: ReturnType<ExternalDB["anniversary"]>;
  };
  "external-db/anniversary-detail": {
    args: [string];
    return: ReturnType<ExternalDB["anniversaryDetail"]>;
  };
  "external-db/503": {
    args: [string];
    return: ReturnType<ExternalDB["fetch503Data"]>;
  };
}
