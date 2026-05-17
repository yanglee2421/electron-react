import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import dayjs from "dayjs";
import { app, dialog } from "electron";
import type { DB } from "./db";

export const registerIPCHandlers = (db: DB) => {
  ipcHandle("DB/EXPORT", async (_) => {
    const result = await dialog.showSaveDialog({
      title: "导出数据库",
      defaultPath: `${app.getPath("desktop")}/${dayjs().format("YYYY年MM月DD日-HH时mm分ss")}.db`,
      filters: [
        { name: "数据库文件", extensions: ["db"] },
        { name: "所有文件", extensions: ["*"] },
      ],
    });

    const outputPath = result.filePath;

    return db.export(outputPath);
  });

  return () => {
    ipcRemoveHandle("DB/EXPORT");
  };
};
