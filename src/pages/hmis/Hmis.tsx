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
import {
  useFetchInfoFromAPI,
  useAutoInputToVC,
  useUploadByZh,
} from "./fetchers";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import dayjs from "dayjs";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { GetRecord } from "./fetcher_type";
import { cellPaddingMap, rowsPerPageOptions } from "@/lib/utils";

type ActionCellProps = {
  id: string;
  zh: string;
};

const ActionCell = (props: ActionCellProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const set = useIndexedStore((s) => s.set);
  const uploadByZh = useUploadByZh();
  const toast = useSnackbar();

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertOutlined />
      </IconButton>
      <Menu open={!!anchorEl} onClose={handleClose} anchorEl={anchorEl}>
        <MenuItem
          onClick={() => {
            uploadByZh.mutate(props.zh, {
              onError(error) {
                toast.enqueueSnackbar(error.message, {
                  variant: "error",
                });
              },
              onSuccess(data) {
                console.log(data);

                toast.enqueueSnackbar("上传成功", {
                  variant: "success",
                });
                handleClose();
              },
            });
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
              d.getRecords = d.getRecords.filter(
                (i) => !Object.is(i.id, props.id)
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

const columnHelper = createColumnHelper<GetRecord>();

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
    cell: ({ row }) => <ActionCell id={row.id} zh={row.getValue("zh")} />,
  }),
];

export const Hmis = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const formId = React.useId();

  const toast = useSnackbar();
  const form = useScanerForm();
  const autoInput = useAutoInputToVC();
  const fetchInfoFromAPI = useFetchInfoFromAPI();
  const settings = useIndexedStore((s) => s.settings);
  const getRecords = useIndexedStore((s) => s.getRecords);
  const set = useIndexedStore((s) => s.set);

  const table = useReactTable({
    data: getRecords,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    if (!settings.autoUpload) return;

    const timer = setInterval(() => {}, 1000 * 30);
    return () => clearInterval(timer);
  }, [settings.autoUpload]);

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
              onSubmit={form.handleSubmit((data) => {
                fetchInfoFromAPI.mutate(
                  {
                    barCode: data.barCode,
                    ip: settings.api_ip,
                    port: settings.api_port,
                  },
                  {
                    onSuccess: (data) => {
                      set((d) => {
                        d.getRecords = d.getRecords.filter((i) =>
                          dayjs(i.date).isAfter(dayjs().startOf("day"))
                        );
                        d.getRecords.unshift({
                          id: crypto.randomUUID(),
                          barCode: data.data[0].DH,
                          zh: data.data[0].ZH,
                          date: new Date().toISOString(),
                          isUploaded: false,
                        });
                      });
                      if (!settings.autoInput) return;
                      autoInput.mutate(
                        {
                          driverPath: settings.driverPath,
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
                            toast.enqueueSnackbar(error.message, {
                              variant: "error",
                            });
                          },
                        }
                      );
                    },
                    onError: (error) => {
                      toast.enqueueSnackbar(error.message, {
                        variant: "error",
                      });
                    },
                  }
                );
                form.reset();
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
