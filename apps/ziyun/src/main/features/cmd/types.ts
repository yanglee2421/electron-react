import type { Cmd } from "./cmd";

export interface AutoInputToVCParams {
  zx: string;
  zh: string;
  czzzdw: string;
  sczzdw: string;
  mczzdw: string;
  czzzrq: string;
  sczzrq: string;
  mczzrq: string;
  ztx: string;
  ytx: string;
}

export interface IPCContract {
  "WIN/autoInputToVC": {
    args: [AutoInputToVCParams];
    return: boolean;
  };
  "WIN/isRunAsAdmin": {
    args: [];
    return: boolean;
  };

  "CMD/open": {
    args: [];
    return: ReturnType<Cmd["openDevice"]>;
  };
  "CMD/close": {
    args: [];
    return: ReturnType<Cmd["closeDevice"]>;
  };
  "CMD/set-db": {
    args: [number, number];
    return: ReturnType<Cmd["itsSetDB"]>;
  };
}
