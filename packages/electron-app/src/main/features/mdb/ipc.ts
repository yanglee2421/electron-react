import { ipcHandle, ipcRemoveHandle } from "#main/ipc";

import dayjs from "dayjs";
import type { MDB } from "./mdb";

export const registerIPCHandlers = (mdb: MDB) => {
  ipcHandle("MDB/MDB_ROOT_GET", async (_, data) => {
    return mdb.getDataFromRootDB(data);
  });
  ipcHandle("MDB/MDB_APP_GET", async (_, data) => {
    return mdb.getDataFromAppDB(data);
  });
  ipcHandle("mdb/quartor", async (_, payload) => {
    const { pageIndex, pageSize, zx, user, date } = payload;
    const query = mdb.root().quartors();

    if (date) {
      query.date(
        "tmnow",
        dayjs(date).startOf("day").toDate(),
        dayjs(date).endOf("day").toDate(),
      );
    }

    if (zx) {
      query.equal("szWHModel", zx);
    }

    if (user) {
      query.equal("szUsername", user);
    }

    const result = await query.offset(pageIndex * pageSize).limit(pageSize);

    return result;
  });

  return () => {
    ipcRemoveHandle("MDB/MDB_ROOT_GET");
    ipcRemoveHandle("MDB/MDB_APP_GET");

    ipcRemoveHandle("mdb/quartor");
  };
};
