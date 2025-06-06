import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Link as MuiLink,
} from "@mui/material";
import * as consts from "@/lib/constants";
import type { XlsxSize } from "#/schema";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/Loading";
import { Link } from "react-router";
import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import React from "react";
import { fetchSqliteXlsxSize, useXlsxSizeDelete } from "@/api/fetch_preload";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer";

type DeleteActionProps = {
  id: number;
};

const DeleteAction = (props: DeleteActionProps) => {
  const remove = useXlsxSizeDelete();

  return (
    <IconButton
      color="error"
      onClick={() => {
        remove.mutate({ id: props.id });
      }}
      disabled={remove.isPending}
    >
      <DeleteOutlined />
    </IconButton>
  );
};

const cellPaddingMap = consts.cellPaddingMap;
const columnHelper = createColumnHelper<XlsxSize>();
const columns = [
  columnHelper.accessor("id", {
    cell({ getValue }) {
      const id = getValue();
      return (
        <MuiLink component={Link} to={`/xlsx/${id}`}>
          #{id}
        </MuiLink>
      );
    },
    header: "ID",
    footer: "ID",
  }),
  columnHelper.accessor("xlsxName", {
    header: "xlsx文件",
    footer: "xlsx文件",
  }),
  columnHelper.accessor("type", {
    cell({ getValue }) {
      const value = getValue();
      switch (value) {
        case "row":
          return "行";
        case "column":
          return "列";
        default:
          return value;
      }
    },
    header: "行/列",
    footer: "行/列",
  }),
  columnHelper.accessor("index", {
    header: "索引",
    footer: "索引",
  }),
  columnHelper.accessor("size", {
    header: "列宽/行高",
    footer: "列宽/行高",
  }),
  columnHelper.display({
    id: "actions",
    header: "操作",
    cell({ row }) {
      const rowId = row.original.id;
      return (
        <>
          <IconButton component={Link} to={`/xlsx/${rowId}/edit`}>
            <EditOutlined />
          </IconButton>
          <DeleteAction id={rowId} />
        </>
      );
    },
  }),
];

type State = {
  pageIndex: number;
  pageSize: number;
  xlsxName: string;
  type: string;
};

type Actions = {
  set(
    nextStateOrUpdater:
      | State
      | Partial<State>
      | ((state: WritableDraft<State>) => void),
  ): void;
};

type Store = State & Actions;

const useSessionStore = create<Store>()(
  persist(
    immer((set) => ({
      pageIndex: 0,
      pageSize: 10,
      xlsxName: "",
      type: "",
      set,
    })),
    {
      storage: createJSONStorage(() => sessionStorage),
      name: "useSessionStore:xlsx",
    },
  ),
);

export const Component = () => {
  "use no memo";
  const pageIndex = useSessionStore((s) => s.pageIndex);
  const pageSize = useSessionStore((s) => s.pageSize);
  const xlsxName = useSessionStore((s) => s.xlsxName);
  const type = useSessionStore((s) => s.type);
  const set = useSessionStore((s) => s.set);

  const query = useQuery({
    ...fetchSqliteXlsxSize({
      pageIndex,
      pageSize,
      xlsxName,
      type,
    }),
  });

  const data = React.useMemo(() => query.data?.rows || [], [query.data]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId(row) {
      return row.id.toString();
    },
    rowCount: query.data?.count,
  });

  const setPageIndex = (page: number) => {
    set((d) => {
      d.pageIndex = page;
    });
  };

  const setPageSize = (size: number) =>
    set((d) => {
      d.pageSize = size;
    });

  const setXlsxName = (xlsx: string) =>
    set((d) => {
      d.xlsxName = xlsx;
    });

  const setType = (type: string) =>
    set((d) => {
      d.type = type;
    });

  const renderRow = () => {
    if (query.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading
              slotProps={{
                box: {
                  padding: 0,
                },
              }}
            />
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
              {query.error.message}
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
    <Card>
      <CardHeader
        title="xlsx尺寸"
        subheader="xlsx尺寸设置"
        action={
          <IconButton>
            <RefreshOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              value={xlsxName}
              onChange={(e) => {
                setXlsxName(e.target.value);
              }}
              select
              fullWidth
              label="xlsx名称"
            >
              <MenuItem value="">无</MenuItem>
              <MenuItem value="chr501">chr501</MenuItem>
              <MenuItem value="chr502">chr502</MenuItem>
              <MenuItem value="chr53a">chr53a</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              value={type}
              onChange={(e) => {
                setType(e.target.value);
              }}
              select
              fullWidth
              label="行/列"
            >
              <MenuItem value="">无</MenuItem>
              <MenuItem value="row">行</MenuItem>
              <MenuItem value="column">列</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardContent>
        <Button
          component={Link}
          to={"/xlsx/new"}
          variant="contained"
          startIcon={<AddOutlined />}
        >
          Add
        </Button>
      </CardContent>
      {query.isFetching && <LinearProgress />}
      <TableContainer>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    padding={consts.cellPaddingMap.get(header.column.id)}
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
                    padding={consts.cellPaddingMap.get(header.column.id)}
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
        count={table.getRowCount()}
        page={pageIndex}
        rowsPerPage={pageSize}
        onPageChange={(e, page) => {
          void e;
          setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          setPageSize(Number.parseInt(e.target.value));
        }}
        rowsPerPageOptions={consts.rowsPerPageOptions}
      />
    </Card>
  );
};
