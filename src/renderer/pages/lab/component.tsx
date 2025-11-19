import {
  DeleteOutlined,
  FolderOutlined,
  ClearAllOutlined,
  FileOpenOutlined,
  FindInPageOutlined,
  NavigateNextOutlined,
  NavigateBeforeOutlined,
  CheckBoxOutlined,
  CheckBoxOutlineBlankOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Grid,
  Badge,
  Button,
  Divider,
  CardHeader,
  CardContent,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  getPaginationRowModel,
} from "@tanstack/react-table";
import React from "react";
import dayjs from "dayjs";
import * as mathjs from "mathjs";
import { useImmer } from "use-immer";
import {
  useOpenPath,
  useShowOpenDialog,
  fetchXMLPDFCompute,
  useSelectXMLPDFFromFolder,
} from "#renderer/api/fetch_preload";
import { NumberField } from "#renderer/components/number";
import { isWithinRange, mapGroupBy } from "#renderer/lib/utils";
import { ScrollToTop } from "#renderer/components/scroll";
import type { Invoice } from "#main/modules/xml";
import type { CallbackFn } from "#renderer/lib/utils";

const fileListToPaths = (fileList: FileList) => {
  return Array.from(fileList, (file) =>
    window.electron.webUtils.getPathForFile(file),
  );
};

const initFiles = () => new Set<string>();
const initIdToItemName = () => new Map<string, string>();
const initIdToDenominator = () => new Map<string, number>();

type IdToDenominatorContextType = [
  Map<string, number>,
  CallbackFn<[string, number], void>,
];

type IdToItemNameContextType = [
  Map<string, string>,
  CallbackFn<[string, string], void>,
];

const IdToDenominatorContext = React.createContext<IdToDenominatorContextType>([
  initIdToDenominator(),
  Boolean,
]);

const IdToItemNameContext = React.createContext<IdToItemNameContextType>([
  initIdToItemName(),
  Boolean,
]);

const getTotalDays = (
  rangeStart: dayjs.Dayjs | null,
  rangeEnd: dayjs.Dayjs | null,
) => {
  if (!rangeStart) return 0;
  if (!rangeEnd) return 0;
  return rangeEnd.diff(rangeStart, "day") + 1;
};

const getSubsidy = (
  rangeStart: dayjs.Dayjs | null,
  rangeEnd: dayjs.Dayjs | null,
  subsidyPerDay: string,
) => {
  const numberOfDays = getTotalDays(rangeStart, rangeEnd);

  return mathjs
    .multiply(mathjs.bignumber(numberOfDays), mathjs.bignumber(subsidyPerDay))
    .toString();
};

const mathjsAdd = (invoiceTotal: string, subsidy: string) => {
  return mathjs
    .add(mathjs.bignumber(invoiceTotal), mathjs.bignumber(subsidy))
    .toString();
};

export const Component = () => {
  const [subsidyPerDay, setSubsidyPerDay] = React.useState("100");
  const [rangeStart, setRangeStart] = React.useState<null | dayjs.Dayjs>(null);
  const [rangeEnd, setRangeEnd] = React.useState<null | dayjs.Dayjs>(null);

  const [files, setFiles] = useImmer(initFiles);
  const [idToDenominator, setIdToDenominator] = useImmer(initIdToDenominator);
  const [idToItemName, setIdToItemName] = useImmer(initIdToItemName);
  const openPath = useOpenPath();
  const showOpenDialog = useShowOpenDialog();
  const selectXMLPDF = useSelectXMLPDFFromFolder();
  const query = useQuery(fetchXMLPDFCompute([...files]));
  const [anchorRef, showScrollToTop] = ScrollToTop.useScrollToTop();

  const invoices = query.data || [];
  const invoiceGroup = mapGroupBy(
    invoices,
    (invoice) => idToItemName.get(String(invoice.id)) || invoice.itemName,
  );
  const invoiceTotal = computeTotal(invoices, idToDenominator);
  const subsidyTotal = getSubsidy(rangeStart, rangeEnd, subsidyPerDay);
  const total = mathjsAdd(invoiceTotal, subsidyTotal);

  const addFiles = async (files: FileList | string[]) => {
    const paths = Array.isArray(files) ? files : fileListToPaths(files);
    const result = await selectXMLPDF.mutateAsync(paths);

    setFiles((draft) => {
      result.forEach((file) => {
        draft.add(file);
      });
    });
  };

  const handleDeletePath = (path: string) => {
    setFiles((draft) => {
      draft.delete(path);
    });
  };

  return (
    <>
      <div ref={anchorRef}></div>
      <ScrollToTop show={showScrollToTop} ref={anchorRef} />
      <Stack spacing={3}>
        <Card>
          <CardHeader
            title="文件"
            action={
              <IconButton
                onClick={() => {
                  setFiles(initFiles);
                }}
              >
                <ClearAllOutlined />
              </IconButton>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                  onPaste={(e) => {
                    addFiles(e.clipboardData.files);
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={async () => {
                              const xmlPDFs = await showOpenDialog.mutateAsync({
                                properties: ["openFile", "multiSelections"],
                                filters: [
                                  {
                                    name: "XML and PDF",
                                    extensions: ["xml", "pdf"],
                                  },
                                ],
                              });

                              await addFiles(xmlPDFs);
                            }}
                          >
                            <FindInPageOutlined />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  placeholder="Paste or Drag files to here"
                />
              </Grid>
              <Grid size={12}>
                <Divider>Or</Divider>
              </Grid>
              <Grid size={12}>
                <Button
                  onClick={async () => {
                    const paths = await showOpenDialog.mutateAsync({
                      properties: ["openDirectory"],
                    });
                    await addFiles(paths);
                  }}
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<FolderOutlined />}
                >
                  Select A Folder
                </Button>
              </Grid>
              <Grid size={12}>
                <List
                  subheader={
                    <ListSubheader sx={{ backgroundColor: "transparent" }}>
                      Files
                    </ListSubheader>
                  }
                >
                  {Array.from(files, (filePath, index) => (
                    <ListItem
                      key={filePath}
                      secondaryAction={
                        <IconButton
                          color="error"
                          onClick={() => {
                            handleDeletePath(filePath);
                          }}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <FileOpenOutlined />
                      </ListItemIcon>
                      <ListItemText
                        primary={`#${index + 1}`}
                        secondary={
                          <Link
                            onClick={() => {
                              openPath.mutate(filePath);
                            }}
                            sx={{ cursor: "pointer" }}
                          >
                            {filePath}
                          </Link>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="发票" />
          {query.isFetching && <LinearProgress />}
          <Divider />
          <IdToDenominatorContext
            value={[
              idToDenominator,
              (id, value) => {
                setIdToDenominator((draft) => {
                  draft.set(id, value);
                });
              },
            ]}
          >
            <IdToItemNameContext
              value={[
                idToItemName,
                (id, value) => {
                  setIdToItemName((draft) => {
                    draft.set(id, value);
                  });
                },
              ]}
            >
              <DataGrid data={query.data || []} />
            </IdToItemNameContext>
          </IdToDenominatorContext>
        </Card>
        <Calendar
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          setRangeStart={setRangeStart}
          setRangeEnd={setRangeEnd}
          subsidyPerDay={subsidyPerDay}
          onSubsidyPerDayChange={setSubsidyPerDay}
        />
        <Card>
          <CardHeader title="结果" />
          <CardContent>
            <List>
              {Array.from(invoiceGroup, ([itemName, invoices]) => (
                <ListItem
                  key={itemName}
                  secondaryAction={computeTotal(invoices, idToDenominator)}
                >
                  <ListItemText primary={itemName} />
                </ListItem>
              ))}
              <ListItem secondaryAction={subsidyTotal}>
                <ListItemText primary={"餐补"} />
              </ListItem>
              <ListItem secondaryAction={total}>
                <ListItemText primary={"总计"} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};

type DenominatorCellProps = {
  id: string;
};

const DenominatorCell = (props: DenominatorCellProps) => {
  const [IdToDenominator, handleChange] = React.use(IdToDenominatorContext);

  return (
    <NumberField
      field={{
        value: IdToDenominator.get(props.id) || 1,
        onChange(value) {
          handleChange(props.id, value);
        },
        onBlur() {},
      }}
      size="small"
      _min={1}
    />
  );
};

const columnHelper = createColumnHelper<Invoice>();

const columns = [
  columnHelper.accessor("id", {
    header: "发票号码",
  }),
  columnHelper.accessor("pdf", {
    header: "PDF",
    cell: ({ getValue }) => {
      return <BooleanCell value={!!getValue()} />;
    },
  }),
  columnHelper.accessor("xml", {
    header: "XML",
    cell: ({ getValue }) => {
      return <BooleanCell value={!!getValue()} />;
    },
  }),
  columnHelper.accessor("totalTaxIncludedAmount", {
    header: "价税合计",
  }),
  columnHelper.accessor("requestTime", {
    header: "开票日期",
  }),
  columnHelper.accessor("itemName", {
    header: "项目名称",
    cell(props) {
      return <ItemNameCell id={props.row.id} value={props.getValue() || ""} />;
    },
  }),
  columnHelper.accessor("additionalInformation", {
    header: "备注",
  }),
  columnHelper.display({
    id: "denominator",
    header: "拆票",
    cell: ({ row }) => {
      return <DenominatorCell id={row.id} />;
    },
  }),
];

type DataGridProps = {
  data: Invoice[];
  isFetching?: boolean;
};

const DataGrid = (props: DataGridProps) => {
  "use no memo";

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columns,
    data: props.data,
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 50,
      },
    },
  });

  const renderRows = () => {
    const rows = table.getRowModel().rows;

    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Typography variant="overline">No data</Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row) => (
      <React.Fragment key={row.id}>
        <TableRow>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {cell.getIsPlaceholder() ||
                flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <OpenPathLink filePath={row.original.filePath}>
              <Typography variant="overline" color="textSecondary">
                {row.original.filePath}
              </Typography>
            </OpenPathLink>
          </TableCell>
        </TableRow>
      </React.Fragment>
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
                  <TableCell key={header.id}>
                    {header.isPlaceholder ||
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>{renderRows()}</TableBody>
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder ||
                      flexRender(
                        header.column.columnDef.header,
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
        page={table.getState().pagination.pageIndex}
        rowsPerPage={table.getState().pagination.pageSize}
        rowsPerPageOptions={[50, 100]}
        onPageChange={(_, page) => {
          table.setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          table.setPageSize(Number.parseInt(e.target.value));
        }}
      />
    </>
  );
};

const computeTotal = (
  invoices: Invoice[],
  denominatorMap: Map<string, number>,
) => {
  const total = invoices.reduce((latestResult, invoice) => {
    return mathjs
      .add(
        mathjs.bignumber(latestResult),
        mathjs.divide(
          mathjs.bignumber(invoice.totalTaxIncludedAmount),
          mathjs.bignumber(denominatorMap.get(invoice.id) || 1),
        ),
      )
      .toString();
  }, "0");

  return total;
};

type OpenPathLinkProps = {
  children?: React.ReactNode;
  filePath: string;
};

const OpenPathLink = (props: OpenPathLinkProps) => {
  const openPath = useOpenPath();

  return (
    <Link
      onClick={() => {
        openPath.mutate(props.filePath);
      }}
      sx={{ cursor: "pointer" }}
    >
      {props.children}
    </Link>
  );
};

const getMonthCalendar = (date: dayjs.Dayjs) => {
  const startOfMonth = date.startOf("month");
  const endOfMonth = date.endOf("month");
  const startWeekday = startOfMonth.day();
  const endWeekday = endOfMonth.day();
  const calendarStart = startOfMonth.subtract(startWeekday, "day");
  const calendarEnd = endOfMonth.add(6 - endWeekday, "day");
  const totalDays = calendarEnd.diff(calendarStart, "day") + 1;

  const days = Array.from({ length: totalDays }, (_, i) =>
    calendarStart.add(i, "day"),
  );

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
};

const initDayjs = () => dayjs();

type CalendarProps = {
  rangeStart: dayjs.Dayjs | null;
  rangeEnd: dayjs.Dayjs | null;
  setRangeStart: React.Dispatch<React.SetStateAction<dayjs.Dayjs | null>>;
  setRangeEnd: React.Dispatch<React.SetStateAction<dayjs.Dayjs | null>>;
  subsidyPerDay: string;
  onSubsidyPerDayChange: (value: string) => void;
};

const Calendar = (props: CalendarProps) => {
  const { rangeStart, rangeEnd, setRangeStart, setRangeEnd } = props;

  const [selectDate, setSelectDate] = React.useState(initDayjs);

  const monthCalendar = getMonthCalendar(selectDate);

  return (
    <Card>
      <CardHeader
        title="日期"
        subheader={`共${getTotalDays(rangeStart, rangeEnd)}天`}
        action={
          <>
            <IconButton
              onClick={() => {
                setSelectDate((prev) => prev.month(prev.month() - 1));
              }}
            >
              <NavigateBeforeOutlined />
            </IconButton>
            <IconButton
              onClick={() => {
                setSelectDate((prev) => prev.month(prev.month() + 1));
              }}
            >
              <NavigateNextOutlined />
            </IconButton>
          </>
        }
      />
      <CardContent>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={selectDate}
              onChange={(e) => {
                if (!e) return;
                setSelectDate(e);
              }}
              slotProps={{
                textField: { fullWidth: true },
              }}
              views={["month", "year"]}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              value={props.subsidyPerDay}
              onChange={(e) => {
                props.onSubsidyPerDayChange(e.target.value);
              }}
              select
              fullWidth
              label="餐补/天"
            >
              <MenuItem value="50">50</MenuItem>
              <MenuItem value="100">100</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={rangeStart}
              onChange={(e) => {
                setRangeStart(e);
              }}
              maxDate={rangeEnd || void 0}
              slotProps={{
                textField: { fullWidth: true },
                field: { clearable: true },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              value={rangeEnd}
              onChange={(e) => {
                setRangeEnd(e);
              }}
              minDate={rangeStart || void 0}
              slotProps={{
                textField: { fullWidth: true },
                field: { clearable: true },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: 7 }, (_, index) => {
                const day = dayjs().day(index).format("dddd");

                return <TableCell key={day}>{day}</TableCell>;
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {monthCalendar.map((dates, index) => (
              <TableRow key={index}>
                {dates.map((date) => {
                  const dateText = date.date();
                  return (
                    <TableCell key={dateText}>
                      <Badge
                        color="primary"
                        badgeContent={
                          isWithinRange(
                            date.valueOf(),
                            rangeStart?.valueOf() || Number.POSITIVE_INFINITY,
                            rangeEnd?.valueOf() || Number.NEGATIVE_INFINITY,
                          )
                            ? date.diff(rangeStart, "day") + 1
                            : null
                        }
                      >
                        {dateText}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow></TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Card>
  );
};

type ItemNameCellProps = {
  id: string;
  value: string;
};

const ItemNameCell = (props: ItemNameCellProps) => {
  const [editable, setEditable] = React.useState(false);

  const [idToItemName, setIdToItemName] = React.use(IdToItemNameContext);

  const itemName = idToItemName.get(props.id) || props.value;

  if (editable) {
    return (
      <TextField
        value={itemName}
        onChange={(e) => {
          setIdToItemName(props.id, e.target.value);
        }}
        onBlur={() => {
          setEditable(false);
        }}
        size="small"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => {
        setEditable(true);
      }}
      style={{ whiteSpace: "nowrap" }}
    >
      {itemName || props.value}
    </span>
  );
};

type BooleanCellProps = {
  value: boolean;
};

const BooleanCell = ({ value }: BooleanCellProps) => {
  return value ? <CheckBoxOutlined /> : <CheckBoxOutlineBlankOutlined />;
};
