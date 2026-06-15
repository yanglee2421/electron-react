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
}
