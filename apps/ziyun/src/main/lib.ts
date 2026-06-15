import { BrowserWindow } from "electron";
import os from "node:os";

export const getIP = () => {
  const interfaces = os.networkInterfaces();
  const IP = Object.values(interfaces)
    .flat()
    .find((i) => {
      if (!i) return false;

      if (i.family !== "IPv4") {
        return false;
      }

      if (i.address === "192.168.1.100") {
        return false;
      }

      return !i.internal;
    })?.address;
  return IP || "";
};

export const createEmit = <TData = void>(channel: string) => {
  return (data: TData) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, data);
    });
  };
};
