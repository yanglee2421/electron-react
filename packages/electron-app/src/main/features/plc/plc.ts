import { FXPLCClient, TransportSerial } from "node-fxplc";
import { SerialPort } from "serialport";
import type { PLCReadResult, PLCWritePayload } from "./types";

export class PLC {
  private readonly DEFAULT_PATH: string = "COM1";
  private readonly registers = [
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

  constructor() {}

  createPLCClient(path: string = this.DEFAULT_PATH) {
    const port = new TransportSerial({
      path,
      baudRate: 9600,
      timeout: 1000 * 15,
    });

    const plc = new FXPLCClient(port);

    return plc;
  }

  async handleReadState(path: string): Promise<PLCReadResult> {
    const plc = this.createPLCClient(path);
    let err = null;
    let result: PLCReadResult | null = null;

    try {
      const values = await plc.batchRead(this.registers);

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
  }

  handleSerialPortList() {
    return SerialPort.list();
  }

  async handleWriteState(payload: PLCWritePayload) {
    const { path, ...restPayload } = payload;
    const plc = this.createPLCClient(path);
    let err = null;

    const { registers, values } = Object.entries(restPayload).reduce(
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
  }
}
