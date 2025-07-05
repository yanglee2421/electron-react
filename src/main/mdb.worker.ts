import MDBReader from "mdb-reader";
import { parentPort } from "node:worker_threads";
import fs from "node:fs/promises";

parentPort?.addListener("message", async (data) => {
  const tableName = data.tableName;
  const databasePath = data.databasePath;
  const pageIndex = data.pageIndex || 0;
  const pageSize = data.pageSize || 20;

  const buf = await fs.readFile(databasePath);
  const mdbReader = new MDBReader(buf, {
    password: "Joney",
  });
  const table = mdbReader.getTable(tableName);
  const rowsPerPage = 500;
  const result = [];

  for (let i = 0; i < table.rowCount; i += rowsPerPage) {
    const rows = table.getData({
      rowOffset: i,
      rowLimit: rowsPerPage,
    });
    result.push(...rows);
  }

  parentPort?.postMessage(
    result.reverse().slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
  );
});
