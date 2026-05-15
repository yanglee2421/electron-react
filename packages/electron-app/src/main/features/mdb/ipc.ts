import { ipcHandle, ipcRemoveHandle } from "#main/ipc";

import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import type { MDB } from "./mdb";

export const registerIPCHandlers = (mdb: MDB) => {
  // DEPRECATED
  ipcHandle("MDB/MDB_ROOT_GET", async (_, data) => {
    return mdb.getDataFromRootDB(data);
  });
  ipcHandle("MDB/MDB_APP_GET", async (_, data) => {
    return mdb.getDataFromAppDB(data);
  });

  // Basic
  ipcHandle("mdb/user", async (_, payload) => {
    const { pageIndex, pageSize } = payload;
    const result = await mdb
      .app()
      .users()
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    return result;
  });

  // Report
  ipcHandle("mdb/verifies", async (_, payload) => {
    const { pageIndex, pageSize, date, user, zx } = payload;
    const query = mdb.root().verifies();

    if (date) {
      query.date(
        "tmNow",
        dayjs(date).startOf("day").toDate(),
        dayjs(date).endOf("day").toDate(),
      );
    }

    if (zx) {
      query.like("szWHModel", zx);
    }

    if (user) {
      query.like("szUsername", user);
    }

    const result = await query
      .orderBy("tmNow", "desc")
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    return result;
  });

  ipcHandle("mdb/verifies/id", async (_, id) => {
    const records = await mdb.root().verifies().equal("szIDs", id);
    const datas = await mdb.root().verifies_data().equal("opid", id);
    const record = records.rows.at(0);

    if (!record) {
      throw new Error(`Not Found #${id}`);
    }

    return { record, datas: datas.rows };
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
      query.like("szWHModel", zx);
    }

    if (user) {
      query.like("szUsername", user);
    }

    const result = await query
      .orderBy("tmnow", "desc")
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    return result;
  });

  ipcHandle("mdb/quartor/id", async (_, id) => {
    const records = await mdb.root().quartors().equal("szIDs", id);
    const datas = await mdb.root().quartors_data().equal("opid", id);
    const record = records.rows.at(0);

    if (!record) {
      throw new Error(`Not Found #${id}`);
    }

    return {
      record,
      datas: datas.rows,
    };
  });

  ipcHandle("mdb/anniversary", async (_, { pageIndex, pageSize }) => {
    const data = await mdb.root().Quartor();
    const map = mapGroupBy(data.rows, (item) => item.szIDs);
    const count = map.size;
    const rows = Array.from(map, ([id, rows]) => {
      return { id, rows };
    }).slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    return { count, rows };
  });

  ipcHandle("mdb/anniversary/id", async (_, id) => {
    const data = await mdb.root().Quartor().equal("szIDs", id);

    return data;
  });

  ipcHandle("mdb/detections", async (_, payload) => {
    const { pageIndex, pageSize, date, user, zx, zh, result } = payload;
    const query = mdb.root().detections();

    if (date) {
      query.date(
        "tmnow",
        dayjs(date).startOf("day").toDate(),
        dayjs(date).endOf("day").toDate(),
      );
    }

    if (zx) {
      query.like("szWHModel", zx);
    }

    if (user) {
      query.like("szUsername", user);
    }

    if (zh) {
      query.like("szIDsWheel", zh);
    }

    if (result) {
      query.like("szResult", result);
    }

    const queryResult = await query
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    return queryResult;
  });

  ipcHandle("mdb/detections/id", async (_, id) => {
    const records = await mdb.root().detections().equal("szIDs", id);
    const datas = await mdb.root().detections_data().equal("opid", id);
    const record = records.rows.at(0);

    if (!record) {
      throw new Error(`Not Found #${id}`);
    }

    return {
      record,
      datas: datas.rows,
    };
  });

  return () => {
    // DEPRECATED
    ipcRemoveHandle("MDB/MDB_ROOT_GET");
    ipcRemoveHandle("MDB/MDB_APP_GET");

    ipcRemoveHandle("mdb/user");
    ipcRemoveHandle("mdb/verifies");
    ipcRemoveHandle("mdb/verifies/id");
    ipcRemoveHandle("mdb/quartor");
    ipcRemoveHandle("mdb/quartor/id");
    ipcRemoveHandle("mdb/anniversary");
    ipcRemoveHandle("mdb/anniversary/id");
    ipcRemoveHandle("mdb/detections");
    ipcRemoveHandle("mdb/detections/id");
  };
};
