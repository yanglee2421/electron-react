import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
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
import {
  AddOutlined,
  ClearOutlined,
  DeleteOutlined,
  RemoveOutlined,
} from "@mui/icons-material";
import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Log } from "@/lib/db";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/constants";

const columnHelper = createColumnHelper<Log>();

const columns = [
  columnHelper.display({
    id: "expand",
    cell: ({ row }) => (
      <IconButton onClick={row.getToggleExpandedHandler()}>
        {!row.getIsExpanded() ? <RemoveOutlined /> : <AddOutlined />}
      </IconButton>
    ),
  }),
  columnHelper.accessor("id", {
    cell: ({ getValue }) => <Link>#{getValue()}</Link>,
  }),
  columnHelper.accessor("date", {
    cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
  }),
  columnHelper.accessor("type", {
    cell: ({ getValue }) => <Chip label={getValue()} />,
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <>
        <IconButton
          onClick={() => {
            db.log.delete(row.getValue("id"));
          }}
        >
          <DeleteOutlined color="error" />
        </IconButton>
      </>
    ),
  }),
];

export const Component = () => {
  "use no memo";
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20);

  const logs = useLiveQuery(
    () =>
      db.log
        .orderBy("date")
        .reverse()
        .offset(pageIndex * pageSize)
        .limit(pageSize)
        .toArray(),
    [pageIndex, pageSize],
  );

  const count = useLiveQuery(() => db.log.count(), []);
  const data = React.useMemo(() => logs || [], [logs]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    rowCount: count,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  const renderRow = () => {
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
      <React.Fragment key={row.id}>
        <TableRow>
          {row.getVisibleCells().map((cell) => (
            <TableCell
              key={cell.id}
              padding={cellPaddingMap.get(cell.column.id)}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
        {row.getIsExpanded() || (
          <TableRow>
            <TableCell colSpan={table.getAllLeafColumns().length}>
              {row.original.message}
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Card>
      <CardHeader
        title="日志"
        action={
          <IconButton
            onClick={() => {
              db.log.clear();
            }}
          >
            <ClearOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Button variant="outlined">Click</Button>
      </CardContent>
      <LinearProgress />
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
        count={table.getRowCount()}
        rowsPerPage={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(e, page) => {
          void e;
          setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          setPageSize(Number.parseInt(e.target.value, 10));
        }}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
