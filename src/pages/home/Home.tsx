import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
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

export const UI = () => {
  const settings = useIndexedStore((s) => s.settings);

  return (
    <Card>
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
