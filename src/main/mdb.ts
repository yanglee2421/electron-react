import MDBReader from "mdb-reader";
import { settings } from "./store";
import fs from "node:fs/promises";

type GetDataFromMDBParams = {
  table: string;
  pageIndex: number;
  pageSize: number;
};

export const init = async (params: GetDataFromMDBParams) => {
  const databasePath = settings.get("databasePath");
  if (!databasePath) return;
  const buf = await fs.readFile(databasePath);
  const mdbReader = new MDBReader(buf, {
    password: "Joney",
  });
  const table = mdbReader.getTable(params.table);
  return table.getData({
    rowOffset: params.pageIndex * params.pageSize,
    rowLimit: params.pageSize,
  });
};
