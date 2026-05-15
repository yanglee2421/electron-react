import type { ListAnniversaryOutputItem } from "#main/features/mdb/types";
import { fetchAnniversary } from "#renderer/api/mdb";
import { Loading } from "#renderer/components/Loading";
import { cellPaddingMap } from "#renderer/lib/constants";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
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
import { Link as RouterLink } from "react-router";

const columnHelper = createColumnHelper<ListAnniversaryOutputItem>();
const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => {
      const value = info.getValue();
      return (
        <Link component={RouterLink} to={`/anniversary/${value}`}>
          {value}
        </Link>
      );
    },
  }),
];

export const Component = () => {
  "use no memo";

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);

  const query = useQuery(fetchAnniversary({ pageIndex, pageSize }));

  const data = React.useMemo(() => query.data?.rows || [], [query.data?.rows]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (row) => row.id,
    manualPagination: true,
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
        <CardHeader
          title="年度校验"
          action={
            <IconButton
              onClick={() => query.refetch()}
              disabled={query.isRefetching}
            >
              <Refresh />
            </IconButton>
          }
        />
        <CardContent></CardContent>
        {query.isFetching && <LinearProgress />}
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
        <TablePagination
          component={"div"}
          count={query.data?.count || 0}
          page={pageIndex}
          rowsPerPage={pageSize}
          onPageChange={(_, page) => setPageIndex(page)}
          onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[100, 200]}
          labelRowsPerPage="每页行数"
        />
      </Card>
    </>
  );
};
