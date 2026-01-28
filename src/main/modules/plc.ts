import { channel } from "#main/channel";
import { ipcHandle } from "#main/lib";
import { devLog } from "#main/utils";
import { FXPLCClient, TransportSerial } from "node-fxplc";

export const bindIpcHandler = () => {
  ipcHandle(channel.PLC.test, async () => {
    const port = new TransportSerial({
      path: "COM1",
      baudRate: 9600,
      timeout: 1000 * 15,
    });

    const plc = new FXPLCClient(port);

    try {
      const bit = await plc.readBit("M22");
      await plc.writeBit("M22", !bit);
      const newBit = await plc.readBit("M22");
      devLog(true, newBit);
    } finally {
      plc.close();
    }
  });
};
