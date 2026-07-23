import type { ExternalDB } from "./external-db";

export interface IPCContract {
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
  "external-db/501": {
    args: [string];
    return: ReturnType<ExternalDB["fetch501Data"]>;
  };
}
