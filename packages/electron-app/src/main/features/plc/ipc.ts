import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { PLC } from "./plc";

export const bindIpcHandlers = (plc: PLC) => {
  ipcHandle("PLC/read_test", (_, path) => {
    return plc.handleReadState(path);
  });
  ipcHandle("PLC/write_test", (_, payload) => {
    plc.handleWriteState(payload);
  });
  ipcHandle("PLC/serialport_list", () => {
    return plc.handleSerialPortList();
  });

  return () => {
    ipcRemoveHandle("PLC/read_test");
    ipcRemoveHandle("PLC/write_test");
    ipcRemoveHandle("PLC/serialport_list");
  };
};
