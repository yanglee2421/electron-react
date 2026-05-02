import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { app, dialog } from "electron";
import type { DB } from "./db";

export const registerIPCHandlers = (db: DB) => {
  ipcHandle("DB/EXPORT", async (_) => {
    const result = await dialog.showSaveDialog({
      title: "导出数据库",
      defaultPath: `${app.getPath("desktop")}/db-${Date.now()}.db`,
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
