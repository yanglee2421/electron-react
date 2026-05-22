import { ipcHandle, ipcRemoveHandle } from "#main/ipc";

import type { PLC } from "./plc";

export const registerIPCHandlers = (plc: PLC) => {
  ipcHandle("PLC/read_test", (_, path) => {
    return plc.handleReadState(path);
  });
  ipcHandle("PLC/write_test", (_, payload) => {
    plc.handleWriteState(payload);
  });
  ipcHandle("PLC/serialport_list", () => {
    return plc.handleSerialPortList();
  });
  ipcHandle("plc/d_read", (_, payload) => {
    return plc.handleDRead(payload);
  });
  ipcHandle("plc/d_write", (_, payload) => {
    return plc.handleDWrite(payload);
  });
  ipcHandle("plc/m_read", (_, payload) => {
    return plc.handleMRead(payload);
  });
  ipcHandle("plc/m_write", (_, payload) => {
    return plc.handleMWrite(payload);
  });
  ipcHandle("plc/x_read", (_, payload) => {
    return plc.handleXRead(payload);
  });
  ipcHandle("plc/y_read", (_, payload) => {
    return plc.handleYRead(payload);
  });
  ipcHandle("plc/y_write", (_, payload) => {
    return plc.handleYWrite(payload);
  });

  return () => {
    ipcRemoveHandle("PLC/read_test");
    ipcRemoveHandle("PLC/write_test");
    ipcRemoveHandle("PLC/serialport_list");
    ipcRemoveHandle("plc/d_read");
    ipcRemoveHandle("plc/d_write");
    ipcRemoveHandle("plc/m_read");
    ipcRemoveHandle("plc/m_write");
    ipcRemoveHandle("plc/x_read");
    ipcRemoveHandle("plc/y_read");
    ipcRemoveHandle("plc/y_write");
  };
};
