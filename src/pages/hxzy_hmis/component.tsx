import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckOutlined,
  ClearOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  KeyboardReturnOutlined,
  MoreVertOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  IconButton,
  InputAdornment,
  Table,
  TableContainer,
  TableFooter,
  TextField,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Button,
  Divider,
  Checkbox,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { useSnackbar } from "notistack";
import { useGetData, useSaveData, useAutoInputToVC } from "./fetchers";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import dayjs from "dayjs";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/utils";
import type { History } from "@/hooks/useIndexedStore";

type ActionCellProps = {
  id: string;
  zh: string;
};

const ActionCell = (props: ActionCellProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const saveData = useSaveData();
  const snackbar = useSnackbar();
  const set = useIndexedStore((s) => s.set);
  const settings = useIndexedStore((s) => s.settings);
  const hmis = useIndexedStore((s) => s.hxzy_hmis);

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertOutlined />
      </IconButton>
      <Menu open={!!anchorEl} onClose={handleClose} anchorEl={anchorEl}>
        <MenuItem
          onClick={() => {
            saveData.mutate(
              {
                dh: props.id,
                zh: props.zh,
                databasePath: settings.databasePath,
                driverPath: settings.driverPath,
                host: hmis.host,
              },
              {
                onError(error) {
                  snackbar.enqueueSnackbar(error.message, {
                    variant: "error",
                  });
                },
                onSuccess() {
                  handleClose();
                },
              }
            );
          }}
        >
          <ListItemIcon>
            <CloudUploadOutlined />
          </ListItemIcon>
          <ListItemText primary="上传" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            set((d) => {
              d.hxzy_hmis.history = d.hxzy_hmis.history.filter(
                (row) => row.id !== props.id
              );
            });
            handleClose();
          }}
        >
          <ListItemIcon>
            <DeleteOutlined color="error" />
          </ListItemIcon>
          <ListItemText primary="删除" />
        </MenuItem>
      </Menu>
    </>
  );
};

const schema = z.object({
  barCode: z.string().min(1),
});

const useScanerForm = () =>
  useForm({
    defaultValues: {
      barCode: "",
    },
    resolver: zodResolver(schema),
  });

const columnHelper = createColumnHelper<History>();

const columns = [
  columnHelper.display({
    id: "checkbox",
    header: ({ table }) => (
      <Checkbox
        indeterminate={table.getIsSomeRowsSelected()}
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    footer: ({ table }) => (
      <Checkbox
        indeterminate={table.getIsSomeRowsSelected()}
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
  }),
  columnHelper.accessor("id", {
    header: "ID",
    footer: "ID",
    cell: ({ getValue }) => getValue().slice(0, 7),
  }),
  columnHelper.accessor("barCode", {
    header: "单号",
    footer: "单号",
  }),
  columnHelper.accessor("zh", {
    header: "轴号",
    footer: "轴号",
  }),
  columnHelper.accessor("date", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
  }),
  columnHelper.accessor("isUploaded", {
    header: "已上传",
    footer: "已上传",
    cell: ({ getValue }) =>
      getValue() ? <CheckOutlined /> : <ClearOutlined />,
  }),
  columnHelper.display({
    id: "action",
    header: "操作",
    cell: ({ row }) => (
      <ActionCell id={row.getValue("barCode")} zh={row.getValue("zh")} />
    ),
  }),
];

export const Component = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const formId = React.useId();

  const form = useScanerForm();
  const getData = useGetData();
  const saveData = useSaveData();
  const snackbar = useSnackbar();
  const autoInput = useAutoInputToVC();
  const setting = useIndexedStore((s) => s.settings);
  const hmis = useIndexedStore((s) => s.hxzy_hmis);
  const history = useIndexedStore((s) => s.hxzy_hmis.history);

  const table = useReactTable({
    data: history,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    if (!hmis.autoUpload) return;

    const timer = setInterval(async () => {
      for (const row of history) {
        await saveData
          .mutateAsync({
            dh: row.barCode,
            zh: row.zh,
            databasePath: setting.databasePath,
            driverPath: setting.driverPath,
            host: hmis.host,
          })
          .catch(Boolean);
      }
    }, 1000 * 30);
    return () => clearInterval(timer);
  }, [
    hmis.autoUpload,
    history,
    saveData,
    setting.databasePath,
    setting.driverPath,
    hmis.host,
  ]);

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

    return table.getRowModel().rows.map((row) => {
      return (
        <TableRow key={row.id}>
          {row.getVisibleCells().map((cell) => {
            return (
              <TableCell
                key={cell.id}
                padding={cellPaddingMap.get(cell.column.id)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            );
          })}
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader title="扫码" />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12, sm: 10, md: 8, lg: 6, xl: 4 }}>
            <form
              ref={formRef}
              id={formId}
              noValidate
              autoComplete="off"
              onSubmit={form.handleSubmit(async (values) => {
                if (saveData.isPending) return;

                form.reset();

                const data = await getData.mutateAsync(
                  {
                    barCode: values.barCode,
                    host: hmis.host,
                  },
                  {
                    onError: (error) => {
                      snackbar.enqueueSnackbar(error.message, {
                        variant: "error",
                      });
                    },
                  }
                );

                if (!hmis.autoInput) return;

                await autoInput.mutateAsync(
                  {
                    driverPath: setting.driverPath,
                    zx: data.data[0].ZX,
                    zh: data.data[0].ZH,
                    czzzdw: data.data[0].CZZZDW,
                    sczzdw: data.data[0].SCZZDW,
                    mczzdw: data.data[0].MCZZDW,
                    czzzrq: dayjs(data.data[0].CZZZRQ).format("YYYYMM"),
                    sczzrq: dayjs(data.data[0].SCZZRQ).format("YYYYMMDD"),
                    mczzrq: dayjs(data.data[0].MCZZRQ).format("YYYYMMDD"),
                    ztx: "1",
                    ytx: "1",
                  },
                  {
                    onError(error) {
                      snackbar.enqueueSnackbar(error.message, {
                        variant: "error",
                      });
                    },
                  }
                );
              }, console.warn)}
              onReset={() => form.reset()}
            >
              <Controller
                control={form.control}
                name="barCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              form={formId}
                              type="submit"
                              endIcon={<KeyboardReturnOutlined />}
                              variant="contained"
                              disabled={getData.isPending}
                            >
                              录入
                            </Button>
                          </InputAdornment>
                        ),
                        autoFocus: true,
                      },
                    }}
                    label="条形码/二维码"
                    placeholder="请扫描条形码或二维码"
                  />
                )}
              />
            </form>
          </Grid2>
        </Grid2>
      </CardContent>
      <Divider />
      <CardContent>
        <Button variant="outlined" startIcon={<CloudUploadOutlined />}>
          上传
        </Button>
      </CardContent>
      <TableContainer>
        <Table>
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
                      header.getContext()
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
                      header.column.columnDef.header,
                      header.getContext()
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
        page={table.getState().pagination.pageIndex}
        count={table.getRowCount()}
        rowsPerPage={table.getState().pagination.pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={(e, page) => {
          void e;
          table.setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          table.setPageSize(Number.parseInt(e.target.value, 10));
        }}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
