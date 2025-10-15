import {
  useLab,
  useOpenPath,
  useSelectXMLPDFFromFolder,
  useShowOpenDialog,
} from "#renderer/api/fetch_preload";
import { NumberField } from "#renderer/components/number";
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

const fileListToPaths = (fileList: FileList) => {
  return Array.from(fileList, (file) =>
    window.electron.webUtils.getPathForFile(file),
  );
};

const initPaths = () => new Set<string>();
const initIdToDenominator = () => new Map<string, number>();
const IdToDenominatorContext = React.createContext([
  initIdToDenominator(),
  (id: string, value: number) => {
    void id;
    void value;
  },
] as const);

export const Component = () => {
  const [paths, setPaths] = useImmer(initPaths);
  const [idToDenominator, setIdToDenominator] = useImmer(initIdToDenominator);

  const lab = useLab();
  const dialogs = useDialogs();
  const openPath = useOpenPath();
  const showOpenDialog = useShowOpenDialog();
  const selectFolder = useSelectXMLPDFFromFolder();

  const query = useQuery({
    queryKey: ["xxxx", [...paths], [...idToDenominator.entries()]],
    queryFn: async () => {
      return {};
    },
  });

  const addPaths = (files: FileList | string[]) => {
    setPaths((draft) => {
      const paths = Array.isArray(files) ? files : fileListToPaths(files);
      paths.forEach((path) => {
        draft.add(path);
      });
    });
  };

  const handleDeletePath = (path: string) => {
    setPaths((draft) => {
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
                  addPaths(e.dataTransfer.files);
                }}
                onPaste={(e) => {
                  addPaths(e.clipboardData.files);
                }}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            showOpenDialog.mutate(
                              {
                                properties: ["openFile", "multiSelections"],
                                filters: [
                                  {
                                    name: "XML and PDF",
                                    extensions: ["xml", "pdf"],
                                  },
                                ],
                              },
                              {
                                onSuccess: (filePaths) => {
                                  addPaths(filePaths);
                                },
                              },
                            );
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
                onClick={() => {
                  selectFolder.mutate(void 0, {
                    onSuccess: (paths) => {
                      addPaths(paths);
                    },
                  });
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
                {Array.from(paths, (path, index) => (
                  <ListItem
                    key={path}
                    secondaryAction={
                      <IconButton
                        color="error"
                        onClick={() => {
                          handleDeletePath(path);
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
                            openPath.mutate(path);
                          }}
                          sx={{ cursor: "pointer" }}
                        >
                          {path}
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
        <CardHeader title="实验室" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}></Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardContent>
          <Button onClick={() => {}} variant="contained">
            Go
          </Button>
        </CardContent>
        <LinearProgress />
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
          <DataGrid />
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
    />
  );
};

type Row = {
  id: string;
  path: string;
};

const columnHelper = createColumnHelper<Row>();

const columns = [
  columnHelper.accessor("id", {}),
  columnHelper.accessor("path", {}),
  columnHelper.display({
    id: "denominator",
    cell: ({ row }) => {
      return <DenominatorCell id={row.id} />;
    },
  }),
];

const DataGrid = () => {
  "use no memo";

  const table = useReactTable({
    columns,
    data: [],
    getCoreRowModel: getCoreRowModel(),
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
