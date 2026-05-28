import type { ExternalDB } from "./external-db";

export interface IPCContract {
  "external-db/test": {
    args: [];
    return: ReturnType<ExternalDB["test"]>;
  };
}
