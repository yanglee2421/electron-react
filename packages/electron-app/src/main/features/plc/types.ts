export interface PLCReadResult {
  D20: number;
  D21: number;
  D22: number;
  D23: number;
  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
}

export interface PLCWritePayload {
  path: string;

  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
}

export interface ReadXInput {
  path: string;
  address: number;
}

export interface ReadYInput {
  path: string;
  address: number;
}

export interface WriteYInput {
  path: string;
  address: number;
  value: boolean;
}

export interface ReadDInput {
  path: string;
  address: number;
  return: number;
}

export interface WriteDInput {
  path: string;
  address: number;
  value: number;
}

export interface ReadMInput {
  path: string;
  address: number;
  return: boolean;
}

export interface WriteMInput {
  path: string;
  address: number;
  value: boolean;
}

export interface IPCContract {
  "PLC/read_test": {
    args: [string];
    return: PLCReadResult;
  };
  "PLC/write_test": {
    args: [PLCWritePayload];
    return: void;
  };
  "PLC/serialport_list": {
    args: [];
    return: Array<{ path: string }>;
  };

  "plc/x_read": {
    args: [ReadXInput];
    return: boolean;
  };
  "plc/y_read": {
    args: [ReadYInput];
    return: boolean;
  };
  "plc/y_write": {
    args: [string, string];
    return: string;
  };
  "plc/d_read": {
    args: [string];
    return: string;
  };
  "plc/d_write": {
    args: [string, string];
    return: string;
  };
  "plc/m_read": {
    args: [string];
    return: string;
  };
  "plc/m_write": {
    args: [string, string];
    return: string;
  };
}
