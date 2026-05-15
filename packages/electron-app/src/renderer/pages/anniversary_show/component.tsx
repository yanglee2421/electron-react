import type { QuartorYearlyData } from "#main/features/mdb/types";
import { fetchAnniversaryById } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { cellPaddingMap } from "#renderer/lib/constants";
import { Print } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { Link, useParams } from "react-router";

const columnHelper = createColumnHelper<QuartorYearlyData>();
const columns = [
  columnHelper.accessor("szIDs", {}),
  columnHelper.accessor("nBoard", {}),
  columnHelper.accessor("nChannel", {}),
  columnHelper.accessor("tmNow", {
    cell: (info) => info.getValue().toLocaleString(),
  }),
];

export const Component = () => {
  const params = useParams();
  const query = useQuery(fetchAnniversaryById(params.id!));
  const data = React.useMemo(() => query.data?.rows || [], [query.data?.rows]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (row) => row.szIDs,
  });

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading slotProps={{ box: { padding: 0 } }} />
          </TableCell>
        </TableRow>
      );
    }

    if (query.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {query.error?.message}
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (!table.getRowCount()) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            暂无数据
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} padding={cellPaddingMap.get(cell.column.id)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <>
      <Card>
        <CardHeader title="周年校验" />
        <CardContent>
          <Link to={`/anniversary/${params.id}/chr503`}>
            <Button startIcon={<Print />} variant="outlined">
              CHR503
            </Button>
          </Link>
        </CardContent>
        <TableContainer>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      padding={cellPaddingMap.get(header.column.id)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>{renderRow()}</TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  );
};
