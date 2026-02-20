import {
  CheckOutlined,
  ClearOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  KeyboardReturnOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  InputAdornment,
  Table,
  TableFooter,
  TextField,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Button,
  Divider,
  Link,
  CircularProgress,
  TableContainer,
  LinearProgress,
  FormControlLabel,
  Switch,
  Stack,
} from "@mui/material";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { z } from "zod";
import React from "react";
import dayjs from "dayjs";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { immer } from "zustand/middleware/immer";
import { DatePicker } from "@mui/x-date-pickers";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDialogs, useNotifications } from "@toolpad/core";
import { persist, createJSONStorage } from "zustand/middleware";
import { ScrollToTopButton } from "#renderer/components/scroll";
import { cellPaddingMap, rowsPerPageOptions } from "#renderer/lib/constants";
import {
  fetchJtvHmisGuangzhoubeiSetting,
  fetchJtvHmisGuangzhoubeiSqliteGet,
  useJtvHmisGuangzhoubeiApiGet,
  useJtvHmisGuangzhoubeiApiSet,
  useJtvHmisGuangzhoubeiSqliteDelete,
  useJtvHmisGuangzhoubeiSqliteInsert,
  useAutoInputToVC,
} from "#renderer/api/fetch_preload";
import type { NormalizeResponse } from "#main/lib/ipc";
import type { JTVGuangzhoubeiBarcode } from "#main/schema";
import { useAutoFocusInputRef } from "#renderer/hooks/useAutoFocusInputRef";
import { useSubscribe } from "#renderer/hooks/useSubscribe";

const storeInitializer = () => {
  return {
    isZhMode: true,
    showFilter: false,
    pageIndex: 0,
    pageSize: 100,
    date: new Date().toISOString(),
    selectOptions: [] as NormalizeResponse[],
  };
};

const rowSelectColumnHelper = createColumnHelper<NormalizeResponse>();
const columnHelper = createColumnHelper<JTVGuangzhoubeiBarcode>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    footer: "ID",
    cell: ({ getValue }) => <Link underline="none">#{getValue()}</Link>,
  }),
  columnHelper.accessor("barCode", {
    header: "单号",
    footer: "单号",
  }),
  columnHelper.accessor("zh", {
    header: "轴号",
    footer: "轴号",
  }),
  columnHelper.accessor("CZZZRQ", {
    header: "车轴制造",
    footer: "车轴制造",
    cell: ({ getValue }) => dayjs(getValue()).format("YYYY-MM-DD"),
  }),
  columnHelper.accessor("CZZZDW", {
    header: "单位",
    footer: "单位",
  }),
  columnHelper.accessor("date", {
    header: "时间",
    footer: "时间",
    cell: ({ getValue }) => getValue()?.toLocaleString(),
  }),
  columnHelper.accessor("isUploaded", {
    header: "已上传",
    footer: "已上传",
    cell: ({ getValue }) =>
      getValue() ? <CheckOutlined color="success" /> : <ClearOutlined />,
  }),
  columnHelper.display({
    id: "action",
    header: "操作",
    cell: ({ row }) => <ActionCell id={row.getValue("id")} />,
  }),
];

const rowSelectColumns = [
  rowSelectColumnHelper.accessor("ZH", {
    header: "轴号",
    footer: "轴号",
  }),
  rowSelectColumnHelper.accessor("ZX", {
    header: "轴型",
    footer: "轴型",
  }),
  rowSelectColumnHelper.accessor("CZZZRQ", {
    header: "车轴制造",
    footer: "车轴制造",
    cell: ({ getValue }) => dayjs(getValue()).format("YYYY-MM-DD"),
  }),
  rowSelectColumnHelper.accessor("CZZZDW", {
    header: "单位",
    footer: "单位",
  }),
  rowSelectColumnHelper.accessor("SCZZRQ", {
    header: "首次组装日期",
    footer: "首次组装日期",
    cell: ({ getValue }) => dayjs(getValue()).format("YYYY-MM-DD"),
  }),
  rowSelectColumnHelper.accessor("SCZZDW", {
    header: "单位",
    footer: "单位",
  }),
  rowSelectColumnHelper.accessor("MCZZRQ", {
    header: "末次组装日期",
    footer: "末次组装日期",
    cell: ({ getValue }) => dayjs(getValue()).format("YYYY-MM-DD"),
  }),
  rowSelectColumnHelper.accessor("MCZZDW", {
    header: "单位",
    footer: "单位",
  }),
  rowSelectColumnHelper.accessor("DH", {
    header: "单号",
    footer: "单号",
  }),
];

const schema = z.object({
  barCode: z.string().min(1),
});

const useSessionStore = create<ReturnType<typeof storeInitializer>>()(
  persist(immer(storeInitializer), {
    name: "useSessionStore:jtv_guangzhoubei",
    storage: createJSONStorage(() => sessionStorage),
  }),
);

const useScanerForm = () => {
  return useForm({
    defaultValues: {
      barCode: "",
    },
    resolver: zodResolver(schema),
  });
};

type ActionCellProps = {
  id: number;
};

const ActionCell = (props: ActionCellProps) => {
  const snackbar = useNotifications();
  const dialog = useDialogs();
  const saveData = useJtvHmisGuangzhoubeiApiSet();
  const deleteBarcode = useJtvHmisGuangzhoubeiSqliteDelete();

  const handleUpload = () => {
    saveData.mutate(props.id, {
      onError(error) {
        snackbar.show(error.message, {
          severity: "error",
        });
      },
      onSuccess() {
        snackbar.show("上传成功", {
          severity: "success",
        });
      },
    });
  };

  return (
    <>
      <IconButton onClick={handleUpload} disabled={saveData.isPending}>
        <CloudUploadOutlined />
      </IconButton>
      <IconButton
        onClick={async () => {
          const confirmed = await dialog.confirm("确定要删除这条记录吗？", {
            okText: "删除",
            cancelText: "取消",
            title: "警告",
          });
          if (confirmed) {
            deleteBarcode.mutate(props.id, {
              onError(error) {
                snackbar.show(error.message, {
                  severity: "error",
                });
              },
            });
          }
        }}
        disabled={saveData.isPending}
      >
        <DeleteOutlined color="error" />
      </IconButton>
    </>
  );
};

type DataGridProps = {
  rows?: JTVGuangzhoubeiBarcode[];
  count?: number;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (page: number) => void;
  setPageSize: (size: number) => void;
};

const DataGrid = (props: DataGridProps) => {
  "use no memo";

  const { pageIndex, pageSize, count = 0, setPageIndex, setPageSize } = props;

  const data = React.useMemo(() => props.rows || [], [props.rows]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    getCoreRowModel: getCoreRowModel(),

    manualPagination: true,
    rowCount: count,
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
      <TableContainer>
        <Table sx={{ minWidth: (theme) => theme.breakpoints.values.md }}>
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
    </>
  );
};

type RowSelectGridProps = {
  data?: NormalizeResponse[];
  onRowSelect?: (record: NormalizeResponse) => void;
};

const RowSelectGrid = (props: RowSelectGridProps) => {
  "use no memo";

  const rows = React.useMemo(() => props.data || [], [props.data]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns: rowSelectColumns,
    data: rows,
    getRowId(row) {
      return row.DH;
    },

    getPaginationRowModel: getPaginationRowModel(),
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
      <TableRow
        key={row.id}
        hover
        onClick={async () => {
          props.onRowSelect?.(row.original);
        }}
        sx={{ cursor: "pointer" }}
      >
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
      <TableContainer>
        <Table sx={{ minWidth: (theme) => theme.breakpoints.values.md }}>
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
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => {
          table.setPageIndex(page);
        }}
        rowsPerPage={table.getState().pagination.pageSize}
        onRowsPerPageChange={(e) => {
          table.setPageSize(Number.parseInt(e.target.value));
        }}
        rowsPerPageOptions={[10, 20]}
        count={table.getRowCount()}
        labelRowsPerPage="每页行数"
      />
    </>
  );
};

export const Component = () => {
  const zhMode = useSessionStore((store) => store.isZhMode);
  const pageIndex = useSessionStore((store) => store.pageIndex);
  const pageSize = useSessionStore((store) => store.pageSize);
  const dateIso = useSessionStore((store) => store.date);
  const selectOptions = useSessionStore((store) => store.selectOptions);

  const formId = React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | number>(0);

  const date = dayjs(dateIso);

  const params = {
    pageIndex,
    pageSize,
    startDate: date.startOf("day").toISOString(),
    endDate: date.endOf("day").toISOString(),
  };

  const form = useScanerForm();
  const snackbar = useNotifications();
  const autoInput = useAutoInputToVC();
  const inputRef = useAutoFocusInputRef();
  const getData = useJtvHmisGuangzhoubeiApiGet();
  const saveData = useJtvHmisGuangzhoubeiApiSet();
  const insertBarcode = useJtvHmisGuangzhoubeiSqliteInsert();
  const { data: hmis } = useQuery(fetchJtvHmisGuangzhoubeiSetting());
  const barcode = useQuery(fetchJtvHmisGuangzhoubeiSqliteGet(params));

  useSubscribe("api_set", () => {
    barcode.refetch();
  });

  const sendDataItemToWindow = async (dataItem: NormalizeResponse) => {
    if (!hmis) return;
    if (!hmis.autoInput) return;

    await autoInput.mutateAsync(
      {
        zx: dataItem.ZX,
        zh: dataItem.ZH,
        czzzdw: dataItem.CZZZDW,
        sczzdw: dataItem.SCZZDW,
        mczzdw: dataItem.MCZZDW,
        czzzrq: dataItem.CZZZRQ,
        sczzrq: dataItem.SCZZRQ,
        mczzrq: dataItem.MCZZRQ,
        ztx: dataItem.ZTX ? "0" : "1",
        ytx: dataItem.YTX ? "0" : "1",
      },
      {
        onError(error) {
          snackbar.show(error.message, {
            severity: "error",
          });
        },
      },
    );
  };

  const inserDataItemToDB = async (dataItem: NormalizeResponse) => {
    await insertBarcode.mutateAsync(dataItem, {
      onError(error) {
        snackbar.show(error.message, {
          severity: "error",
        });
      },
    });
  };

  const setDate = (day: dayjs.Dayjs) => {
    useSessionStore.setState((draft) => {
      draft.date = day.toISOString();
    });
  };

  const setPageIndex = (page: number) => {
    useSessionStore.setState((draft) => {
      draft.pageIndex = page;
    });
  };

  const setPageSize = (size: number) => {
    useSessionStore.setState((draft) => {
      draft.pageSize = size;
    });
  };

  const setZhMode = (value: boolean) => {
    useSessionStore.setState((draft) => {
      draft.isZhMode = value;
    });
  };

  const handleRowSelect = async (dataItem: NormalizeResponse) => {
    await inserDataItemToDB(dataItem);
    await sendDataItemToWindow(dataItem);
  };

  return (
    <>
      <ScrollToTopButton />
      <Stack spacing={3}>
        <Card>
          <CardHeader title="京天威HMIS" subheader="广州北" />
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={12}>
                <FormControlLabel
                  label="轴号模式"
                  control={
                    <Switch
                      checked={zhMode}
                      onChange={(e) => {
                        setZhMode(e.target.checked);
                      }}
                    />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6, xl: 4 }}>
                <form
                  ref={formRef}
                  id={formId}
                  noValidate
                  autoComplete="off"
                  onSubmit={form.handleSubmit(async (values) => {
                    if (saveData.isPending) return;

                    form.reset();

                    const data = await getData.mutateAsync(
                      { barcode: values.barCode, isZhMode: zhMode },
                      {
                        onError: (error) => {
                          snackbar.show(error.message, {
                            severity: "error",
                          });
                        },
                      },
                    );

                    useSessionStore.setState((draft) => {
                      draft.selectOptions = data;
                    });

                    const isSingleElement = Object.is(data.length, 1);
                    if (!isSingleElement) return;

                    const record = data.at(0)!;
                    if (!record) return;

                    await handleRowSelect(record);
                  }, console.warn)}
                  onReset={() => form.reset()}
                >
                  <Controller
                    control={form.control}
                    name="barCode"
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);

                          if (zhMode) return;
                          clearTimeout(debounceRef.current);
                          debounceRef.current = setTimeout(() => {
                            formRef.current?.requestSubmit();
                          }, 1000 * 1);
                        }}
                        inputRef={inputRef}
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
                                  endIcon={
                                    getData.isPending ? (
                                      <CircularProgress
                                        size={16}
                                        color="inherit"
                                      />
                                    ) : (
                                      <KeyboardReturnOutlined />
                                    )
                                  }
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
                        label={zhMode ? "轴号" : "条形码/二维码"}
                        placeholder={
                          zhMode ? "请输入轴号" : "请扫描条形码或二维码"
                        }
                      />
                    )}
                  />
                </form>
              </Grid>
            </Grid>
          </CardContent>
          <RowSelectGrid data={selectOptions} onRowSelect={handleRowSelect} />
        </Card>
        <Card>
          <CardHeader
            title="上传情况"
            subheader="待上传的轮轴情况"
            action={
              <IconButton
                onClick={() => {
                  barcode.refetch();
                }}
                disabled={barcode.isFetching}
              >
                <RefreshOutlined />
              </IconButton>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="日期"
                  value={date}
                  onChange={(e) => {
                    if (!e) return;
                    setDate(e);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
          <Divider />
          {barcode.isFetching && <LinearProgress />}
          <DataGrid
            rows={barcode.data?.rows}
            count={barcode.data?.count}
            pageIndex={pageIndex}
            pageSize={pageSize}
            setPageIndex={setPageIndex}
            setPageSize={setPageSize}
          />
        </Card>
      </Stack>
    </>
  );
};
