import { fetchDynamicList } from "#renderer/api/qt";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Card,
  CardHeader,
  IconButton,
  LinearProgress,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
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
import type { schema } from "@yanglee2421/external-db";
import React from "react";
import { Link as RouterLink } from "react-router";

type Row = typeof schema.dynamic.$inferSelect;

const columnHelper = createColumnHelper<Row>();
const columns = [
  columnHelper.accessor("recId", { header: "ID" }),
  columnHelper.accessor("szIds", {
    header: "ID",
    cell: ({ row }) => {
      return (
        <Link component={RouterLink} to={`/qt/dynamic/${row.original.recId}`}>
          {row.original.szIds}
        </Link>
      );
    },
  }),
  columnHelper.accessor("szWhModel", { header: "轴型" }),
  columnHelper.accessor("szUsername", { header: "用户" }),
  columnHelper.accessor("startTime", { header: "开始时间" }),
];

export const Component = () => {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(100);

  const query = useQuery(fetchDynamicList());

  const data = React.useMemo(() => {
    return query.data?.rows || [];
  }, [query.data]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading slotProps={{ box: { sx: { padding: 0 } } }} />
          </TableCell>
        </TableRow>
      );
    }

    if (query.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert>
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
      <ScrollToTopButton />
      <Card>
        <CardHeader
          title="动态信噪比"
          action={
            <IconButton
              onClick={() => {
                query.refetch();
              }}
              disabled={query.isRefetching}
            >
              <PendingIcon isPending={query.isRefetching}>
                <Refresh />
              </PendingIcon>
            </IconButton>
          }
        />
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
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      padding={cellPaddingMap.get(header.column.id)}
                    >
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          </Table>
        </TableContainer>
        <TablePagination
          component={"div"}
          page={pageIndex}
          count={query.data?.count || 0}
          rowsPerPage={pageSize}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={(_, page) => {
            setPageIndex(page);
          }}
          onRowsPerPageChange={(e) => {
            setPageSize(Number.parseInt(e.target.value, 10));
          }}
          labelRowsPerPage="每页行数"
        />
      </Card>
    </>
  );
};
