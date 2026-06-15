import { FXPLCClient, TransportSerial } from "node-fxplc";
import type { Observable, Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  last,
  NEVER,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  using,
} from "rxjs";
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

const createPLCClient = (path: string) => {
  const port = new TransportSerial({ path: path, timeout: 1000 * 2 });
  const plc = new FXPLCClient(port);

  return plc;
};

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

export class PLC {
  private path$: BehaviorSubject<string>;
  private plc$: Observable<FXPLCClient | null>;
  private subscription: Subscription;
  private plc: FXPLCClient | null;

  constructor() {
    this.path$ = new BehaviorSubject("");
    this.plc$ = this.path$.pipe(
      distinctUntilChanged(),
      switchMap((path) => {
        if (!path) {
          return of(null);
        }

        return using(
          () => {
            const plc = createPLCClient(path);

            return {
              unsubscribe: () => {
                plc.close();
              },
              plc,
            };
          },
          (c) => {
            const plc: FXPLCClient = Reflect.get(Object(c), "plc");

            return NEVER.pipe(startWith(plc));
          },
        );
      }),
      takeUntil(this.path$.pipe(last())),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

    this.plc = null;
    this.subscription = this.plc$.subscribe({
      next: (plc) => {
        this.plc = plc;
      },
      error: () => {
        this.plc = null;
      },
      complete: () => {
        this.plc = null;
      },
    });
  }

  dispose() {
    this.subscription.unsubscribe();
    this.path$.complete();
  }

  getPLC(path: string) {
    this.path$.next(path);
    const plc = this.plc;

    if (!plc) {
      throw new Error("PLC is not connected");
    }

    return plc;
  }

  async handleReadState(path: string): Promise<PLCReadResult> {
    const plc = this.getPLC(path);
    const values = await plc.batchRead(registers);

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

  open(path: string) {
    this.path$.next(path);
  }
  close() {
    this.path$.next("");
  }
}
