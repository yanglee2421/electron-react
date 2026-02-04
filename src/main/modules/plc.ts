import { channel } from "#main/channel";
import { ipcHandle } from "#main/lib";
import { FXPLCClient, TransportSerial } from "node-fxplc";

export type PLCReadResult = {
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
};

export type PLCWritePayload = {
  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
};

const createPLCClient = (path: string = DEFAULT_PATH) => {
  const port = new TransportSerial({
    path,
    baudRate: 9600,
    timeout: 1000 * 15,
  });

  const plc = new FXPLCClient(port);

  return plc;
};

const DEFAULT_PATH = "COM1";

const registers = [
  "D20",
  "D21",
  "D22",
  "D23",
  "D300",
  "D301",
  "D302",
  "D303",
  "D308",
  "D309",
];

const handleReadState = async (): Promise<PLCReadResult> => {
  const plc = createPLCClient();
  let err = null;
  let result: PLCReadResult | null = null;

  try {
    const values = await plc.batchRead(registers);

    result = {
      D20: values[0],
      D21: values[1],
      D22: values[2],
      D23: values[3],
      D300: values[4],
      D301: values[5],
      D302: values[6],
      D303: values[7],
      D308: values[8],
      D309: values[9],
    };
  } catch (error) {
    err = error;
  } finally {
    plc.close();
  }

  if (result) {
    return result;
  } else {
    throw err || new Error("invalid Result");
  }
};

const handleWriteState = async (payload: PLCWritePayload) => {
  const plc = createPLCClient();
  let err = null;

  const { registers, values } = Object.entries(payload).reduce(
    (result, [key, value], index) => {
      result.registers[index] = key;
      result.values[index] = value;

      return result;
    },
    {
      registers: [] as string[],
      values: [] as number[],
    },
  );

  try {
    await plc.batchWrite(registers, values);
  } catch (error) {
    err = error;
  } finally {
    plc.close();
  }

  if (err) throw err;
  return null;
};

export const bindIpcHandler = () => {
  ipcHandle(channel.PLC.read_test, handleReadState);
  ipcHandle(channel.PLC.write_test, async (_, payload: PLCWritePayload) => {
    await handleWriteState(payload);
  });
};
