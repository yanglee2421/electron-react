import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Alert,
  AlertTitle,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import * as channel from "@electron/channel";
import { ipcRenderer } from "@/lib/utils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useIndexedStore } from "@/hooks/useIndexedStore";

type Res = {
  data: {
    rows: [];
  };
};

const fetchQuartors = (params: channel.DbParamsBase) =>
  queryOptions({
    queryKey: [params.path, params.password, channel.queryQuartors],
    async queryFn() {
      const data: Res = await ipcRenderer.invoke(channel.queryQuartors, params);

      return data;
    },
    networkMode: "offlineFirst",
  });

export const UI = () => {
  const settings = useIndexedStore((s) => s.settings);

  const query = useQuery(
    fetchQuartors({
      path: settings.databasePath,
      password: settings.databasePassword,
      dsn: settings.databaseDsn,
    })
  );

  try {
    console.log(query.data);

    console.log(JSON.parse(query.data?.data.stdout));
  } catch (error) {
    console.error(error);
  }

  return (
    <Card>
      <p>{query.data?.data.stdout}</p>
      <CardHeader title="Data" />
      <CardContent></CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody></TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
