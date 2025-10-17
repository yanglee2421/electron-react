import {
  DeleteOutlined,
  FileOpenOutlined,
  FindInPageOutlined,
  FolderOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
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
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDialogs } from "@toolpad/core";
import React from "react";
import { useImmer } from "use-immer";
import * as mathjs from "mathjs";
import { mapGroupBy } from "#renderer/lib/utils";
import {
  fetchXMLPDFCompute,
  useOpenPath,
  useSelectXMLPDFFromFolder,
  useShowOpenDialog,
} from "#renderer/api/fetch_preload";
import { NumberField } from "#renderer/components/number";
import type { Invoice } from "#main/modules/xml";

const fileListToPaths = (fileList: FileList) => {
  return Array.from(fileList, (file) =>
    window.electron.webUtils.getPathForFile(file),
  );
};

const initFiles = () => new Set<string>();
const initIdToDenominator = () => new Map<string, number>();
const IdToDenominatorContext = React.createContext([
  initIdToDenominator(),
  (id: string, value: number) => {
    void id;
    void value;
  },
] as const);

export const Component = () => {
  const [files, setFiles] = useImmer(initFiles);
  const [idToDenominator, setIdToDenominator] = useImmer(initIdToDenominator);

  useDialogs();
  const openPath = useOpenPath();
  const showOpenDialog = useShowOpenDialog();
  const selectXMLPDF = useSelectXMLPDFFromFolder();
  const query = useQuery(fetchXMLPDFCompute([...files]));

  const resultMap = mapGroupBy(query.data || [], (invoice) => invoice.itemName);
  const total = computeTotal(query.data || [], idToDenominator);

  const addFiles = async (files: FileList | string[]) => {
    const paths = Array.isArray(files) ? files : fileListToPaths(files);
    const result = await selectXMLPDF.mutateAsync(paths);

    result.forEach((file) => {
      setFiles((draft) => {
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
    <Stack spacing={3}>
      <Card>
        <CardHeader title="文件" />
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
          <DataGrid data={query.data || []} />
        </IdToDenominatorContext>
        <TablePagination
          component={"div"}
          count={100}
          page={0}
          rowsPerPage={20}
          rowsPerPageOptions={[20, 50, 100]}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      </Card>
      <Card>
        <CardHeader title="结果" />
        <CardContent>
          <List>
            <ListItem secondaryAction={total}>
              <ListItemText primary={"总计"} />
            </ListItem>
            {Array.from(resultMap.entries(), ([itemName, invoices]) => (
              <ListItem
                key={itemName}
                secondaryAction={computeTotal(invoices, idToDenominator)}
              >
                <ListItemText primary={itemName} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
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
  columnHelper.accessor("id", {}),
  columnHelper.accessor("totalTaxIncludedAmount", {}),
  columnHelper.accessor("requestTime", {}),
  columnHelper.accessor("itemName", {}),
  columnHelper.accessor("additionalInformation", {}),
  columnHelper.display({
    id: "denominator",
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
    columns,
    data: props.data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
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
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {cell.getIsPlaceholder() ||
              flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <>
      <TableContainer>
        <Table>
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
