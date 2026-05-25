import { FXPLCClient, TransportSerial } from "node-fxplc";
import { SerialPort } from "serialport";
import type {
  PLCReadResult,
  PLCWritePayload,
  ReadDInput,
  ReadMInput,
  ReadXInput,
  ReadYInput,
  WriteDInput,
  WriteMInput,
  WriteYInput,
} from "./types";

export class PLC {
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
  private path: string = "";
  private plc: FXPLCClient | null = null;

  constructor() {}

  dispose() {
    this.plc?.close();
  }

  createPLC() {
    const port = new TransportSerial({
      path: this.path,
      baudRate: 9600,
      timeout: 1000 * 15,
    });

    return new FXPLCClient(port);
  }

  getPLC(path: string): FXPLCClient {
    if (path !== this.path) {
      this.path = path;
      this.plc = this.createPLC();

      return this.plc;
    }

    if (!this.plc) {
      this.plc = this.createPLC();

      return this.plc;
    }

    return this.plc;
  }

  async handleReadState(path: string): Promise<PLCReadResult> {
    const plc = this.getPLC(path);
    const values = await plc.batchRead(this.registers);

    const result: PLCReadResult = {
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

    return result;
  }

  handleSerialPortList() {
    return SerialPort.list();
  }

  async handleWriteState(payload: PLCWritePayload) {
    const { path, ...restPayload } = payload;
    const plc = this.getPLC(path);

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

    await plc.batchWrite(registers, values);
    return null;
  }

  async handleXRead(params: ReadXInput) {
    const { path, address } = params;
    const plc = this.getPLC(path);
    const result: boolean = await plc.readBit(`X${address}`);

    return result;
  }

  async handleYRead(params: ReadYInput) {
    const { path, address } = params;
    const plc = this.getPLC(path);
    const result: boolean = await plc.readBit(`Y${address}`);

    return result;
  }

  async handleYWrite(params: WriteYInput) {
    const { path, address, value } = params;
    const plc = this.getPLC(path);

    await plc.writeBit(`Y${address}`, value);

    return value;
  }

  async handleMRead(params: ReadMInput) {
    const { path, address } = params;
    const plc = this.getPLC(path);
    const result = await plc.readBit(`M${address}`);

    return result;
  }

  async handleMWrite(params: WriteMInput) {
    const { path, address, value } = params;
    const plc = this.getPLC(path);

    await plc.writeBit(`M${address}`, value);

    return value;
  }

  async handleDRead(params: ReadDInput) {
    const { path, address } = params;
    const plc = this.getPLC(path);
    const [result] = await plc.batchRead([`D${address}`]);

    return result;
  }

  async handleDWrite(params: WriteDInput) {
    const { path, address, value } = params;
    const plc = this.getPLC(path);

    await plc.batchWrite([`D${address}`], [value]);

    return value;
  }
}
