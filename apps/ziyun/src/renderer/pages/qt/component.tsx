import { useSelectDirectory, useSelectFile } from "#renderer/api/fetch_preload";
import {
  fetchCurrentLocalDB,
  fetchQTConfig,
  fetchQTUsers,
  fetchYiqiConfig,
  QUERY_KEY,
  useDeleteQTUser,
  useSetQTConfig,
  useSetupApp,
  useSetYiqiFlag,
  useSetYiqiLib,
  useStartApp,
  useStopApp,
  useUpsertQTUser,
} from "#renderer/api/qt";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { cellPaddingMap } from "#renderer/lib/constants";
import {
  Add,
  Delete,
  Edit,
  FindInPageOutlined,
  MoreVert,
  Restore,
  Save,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDialogs } from "@toolpad/core";
import type { schema } from "@yanglee2421/external-db";
import React from "react";
import { toast } from "react-toastify";
import { z } from "zod";

const ConfigForm = () => {
  const formId = React.useId();

  const dialog = useDialogs();
  const start = useStartApp();
  const stop = useStopApp();
  const setConfig = useSetQTConfig();
  const config = useQuery(fetchQTConfig());

  const handleRestart = async () => {
    const comfired = await dialog.confirm("更改设置后需要重启，现在重启吗？", {
      title: "提示",
      severity: "warning",
      okText: "确定",
      cancelText: "稍后",
    });

    if (!comfired) return;

    await stop.mutateAsync();
    await new Promise((f) => setTimeout(f, 1000));
    await start.mutateAsync();
  };

  const form = useForm({
    defaultValues: {
      values:
        config.data?.rows
          .filter((r) => r.key)
          .map((r) => ({
            id: r.id,
            key: r.key || "",
            value: r.value || "",
            description: r.description,
            readOnly: !!r.readOnly,
          })) ?? [],
    },
    onSubmit: async ({ value }) => {
      await setConfig.mutateAsync(
        {
          values: value.values.map((i) => ({
            key: i.key,
            value: i.value,
          })),
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: handleRestart,
        },
      );
    },
  });

  if (config.isPending) {
    return null;
  }

  if (config.isError) {
    return null;
  }

  return (
    <Card>
      <CardHeader title="QT软件设置" />
      <CardContent>
        <form.Field name="values" mode="array">
          {(valuesField) => {
            return (
              <form
                id={formId}
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                onReset={() => {
                  form.reset();
                }}
                noValidate
              >
                <Grid container spacing={1.5}>
                  {valuesField.state.value.map((i, index) => {
                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <form.Field name={`values[${index}].value`}>
                          {(field) => (
                            <TextField
                              value={field.state.value}
                              onChange={(e) => {
                                field.handleChange(e.target.value);
                              }}
                              onBlur={field.handleBlur}
                              helperText={i.description}
                              label={i.key}
                              fullWidth
                              slotProps={{ input: { readOnly: i.readOnly } }}
                            />
                          )}
                        </form.Field>
                      </Grid>
                    );
                  })}
                </Grid>
              </form>
            );
          }}
        </form.Field>
      </CardContent>
      <CardActions>
        <Button type="submit" form={formId} startIcon={<Save />}>
          保存
        </Button>
        <Button type="reset" form={formId} startIcon={<Restore />}>
          重置
        </Button>
      </CardActions>
    </Card>
  );
};

type Row = Omit<typeof schema.userManager.$inferSelect, "pwd">;
const columnHelper = createColumnHelper<Row>();
const columns = [
  columnHelper.accessor("recId", {
    header: "ID",
  }),
  columnHelper.accessor("name", {
    header: "用户名",
  }),
  columnHelper.accessor("power", {
    header: "角色",
    cell: ({ getValue }) => {
      const val = getValue();

      switch (val) {
        case "1":
          return "管理员";
        default:
          return " 非管理员";
      }
    },
  }),
  columnHelper.accessor("regTime", {
    header: "注册时间",
  }),
  columnHelper.display({
    id: "action",
    header: "操作",
    cell: ({ row }) => {
      return (
        <ActionCell
          rowId={row.original.recId}
          user={row.original.name || ""}
          power={row.original.power || ""}
        />
      );
    },
  }),
];

interface ActionCellProps {
  rowId: number;
  user: string;
  power: string;
}

const ActionCell = (props: ActionCellProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const formId = React.useId();

  const dialog = useDialogs();
  const deleteUsers = useDeleteQTUser();
  const upsertUsers = useUpsertQTUser();

  const form = useForm({
    defaultValues: {
      user: props.user,
      password: "",
      power: props.power,
    },
    onSubmit: async ({ value }) => {
      await upsertUsers.mutateAsync(
        {
          recId: props.rowId,
          name: value.user,
          power: value.power,
          pwd: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: () => {
            form.reset();
            setShowEdit(false);
            toast.success("保存成功");
          },
        },
      );
    },
    validators: {
      onChange: z.object({
        user: z.string().min(2),
        password: z.string(),
        power: z.string(),
      }),
    },
  });

  return (
    <>
      <Dialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
        }}
        fullWidth
      >
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            onReset={() => {
              form.reset();
              setShowEdit(false);
            }}
            noValidate
          >
            <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
              <Grid size={12}>
                <form.Field name="user">
                  {(field) => {
                    return (
                      <TextField
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        name={field.name}
                        error={!!field.state.meta.errors.length}
                        helperText={field.state.meta.errors.at(0)?.message}
                        label="用户名"
                        fullWidth
                      />
                    );
                  }}
                </form.Field>
              </Grid>
              <Grid size={12}>
                <form.Field name="password">
                  {(field) => {
                    return (
                      <TextField
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                        onBlur={field.handleBlur}
                        name={field.name}
                        error={!!field.state.meta.errors.length}
                        helperText={field.state.meta.errors.at(0)?.message}
                        label="密码"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => {
                                    setShowPassword((p) => !p);
                                  }}
                                >
                                  {showPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                </form.Field>
              </Grid>
              <Grid size={12}>
                <form.Field name="power">
                  {(field) => {
                    return (
                      <RadioGroup
                        value={field.state.value}
                        onChange={(_, value) => {
                          field.handleChange(value);
                        }}
                        row
                      >
                        <FormControlLabel
                          control={<Radio value={"1"} />}
                          label="管理员"
                        />
                        <FormControlLabel
                          control={<Radio value={"2"} />}
                          label="非管理员"
                        />
                      </RadioGroup>
                    );
                  }}
                </form.Field>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button form={formId} type="reset">
            Cancel
          </Button>
          <Button form={formId} type="submit">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
      <IconButton
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setShowEdit(true);
          }}
        >
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText primary="编辑" />
        </MenuItem>
        <MenuItem
          onClick={async () => {
            setAnchorEl(null);

            const confirmed = await dialog.confirm("确定要删除这条记录吗？", {
              okText: "删除",
              cancelText: "取消",
              title: "警告",
              severity: "error",
            });

            if (confirmed) {
              await deleteUsers.mutateAsync(props.rowId);
              toast.success("Ok");
            } else {
              toast.info("Canceled");
            }
          }}
        >
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText primary="删除" />
        </MenuItem>
      </Menu>
    </>
  );
};

const UsersTable = () => {
  const [showEdit, setShowEdit] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const formId = React.useId();

  const upsertUsers = useUpsertQTUser();
  const users = useQuery(fetchQTUsers());

  const form = useForm({
    defaultValues: {
      user: "",
      password: "",
      power: "2",
    },
    onSubmit: async ({ value }) => {
      await upsertUsers.mutateAsync(
        {
          name: value.user,
          power: value.power,
          pwd: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: () => {
            form.reset();
            setShowEdit(false);
            toast.success("保存成功");
          },
        },
      );
    },
    validators: {
      onChange: z.object({
        user: z.string().min(2),
        password: z.string(),
        power: z.string(),
      }),
    },
  });

  const data = React.useMemo(() => users.data?.rows || [], [users.data]);

  const table = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    columns,
    data,
    getRowId: (r) => r.recId.toString(),
  });

  const renderRow = () => {
    if (users.isPending) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length} align="center">
            <Loading slotProps={{ box: { sx: { padding: 0 } } }} />
          </TableCell>
        </TableRow>
      );
    }

    if (users.isError) {
      return (
        <TableRow>
          <TableCell colSpan={table.getAllLeafColumns().length}>
            <Alert severity="error" variant="filled">
              <AlertTitle>错误</AlertTitle>
              {users.error?.message}
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
      <CardHeader title="用户管理" />
      <CardContent>
        <Button
          onClick={() => {
            setShowEdit(true);
          }}
          startIcon={<Add />}
        >
          添加
        </Button>
        <Dialog
          open={showEdit}
          onClose={() => {
            setShowEdit(false);
          }}
          fullWidth
        >
          <DialogTitle>新增用户</DialogTitle>
          <DialogContent>
            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              onReset={() => {
                form.reset();
                setShowEdit(false);
              }}
              noValidate
            >
              <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                <Grid size={12}>
                  <form.Field name="user">
                    {(field) => {
                      return (
                        <TextField
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          error={!!field.state.meta.errors.length}
                          helperText={field.state.meta.errors.at(0)?.message}
                          label="用户名"
                          fullWidth
                        />
                      );
                    }}
                  </form.Field>
                </Grid>
                <Grid size={12}>
                  <form.Field name="password">
                    {(field) => {
                      return (
                        <TextField
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                          }}
                          onBlur={field.handleBlur}
                          error={!!field.state.meta.errors.length}
                          helperText={field.state.meta.errors.at(0)?.message}
                          label="密码"
                          fullWidth
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => {
                                      setShowPassword((p) => !p);
                                    }}
                                  >
                                    {showPassword ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      );
                    }}
                  </form.Field>
                </Grid>
                <Grid size={12}>
                  <form.Field name="power">
                    {(field) => {
                      return (
                        <RadioGroup
                          value={field.state.value}
                          onChange={(_, value) => {
                            field.handleChange(value);
                          }}
                          row
                        >
                          <FormControlLabel
                            control={<Radio value={"1"} />}
                            label="管理员"
                          />
                          <FormControlLabel
                            control={<Radio value={"2"} />}
                            label="非管理员"
                          />
                        </RadioGroup>
                      );
                    }}
                  </form.Field>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
            <Button form={formId} type="reset">
              Cancel
            </Button>
            <Button form={formId} type="submit">
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
      {users.isPending && <LinearProgress />}
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
    </Card>
  );
};

export const Component = () => {
  const formId = React.useId();

  const setupApp = useSetupApp();
  const startApp = useStartApp();
  const stopApp = useStopApp();
  const dialog = useDialogs();
  const start = useStartApp();
  const stop = useStopApp();
  const yiqiLib = useSetYiqiLib();
  const yiqiFlag = useSetYiqiFlag();
  const selectFile = useSelectFile();
  const queryClient = useQueryClient();
  const selectDirectory = useSelectDirectory();
  const config = useQuery(fetchQTConfig());
  const yiqiConfig = useQuery(fetchYiqiConfig());
  const currentLocal = useQuery(fetchCurrentLocalDB());
  const qtAppPath = useProfileStore((s) => s.qtAppPath);
  const form = useForm({
    defaultValues: {
      qtAppPath,
      qtDataDirectory: currentLocal.data || "",
    },
    onSubmit: async ({ value }) => {
      await setupApp.mutateAsync(
        {
          qtAppPath: value.qtAppPath,
          qtDataDirectory: value.qtDataDirectory,
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );

      useProfileStore.setState((d) => {
        d.qtAppPath = value.qtAppPath;
      });

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const handleRestart = async () => {
    const comfired = await dialog.confirm("更改设置后需要重启，现在重启吗？", {
      title: "提示",
      severity: "warning",
      okText: "确定",
      cancelText: "稍后",
    });

    if (!comfired) return;

    await stop.mutateAsync();
    await new Promise((f) => setTimeout(f, 1000));
    await start.mutateAsync();
  };

  const renderYiqiConfig = () => {
    if (yiqiConfig.isPending) {
      return <Loading />;
    }

    if (yiqiConfig.isError) {
      return (
        <Alert severity="error">
          <AlertTitle>数据加载失败</AlertTitle>
          {yiqiConfig.error.message}
        </Alert>
      );
    }

    return yiqiConfig.data.rows.map((row) => {
      return (
        <ListItem
          key={row.recId}
          secondaryAction={
            <IconButton
              edge="end"
              onClick={async () => {
                const paths = await selectFile.mutateAsync([
                  { extensions: ["dll", "so"], name: "库文件" },
                  { extensions: ["*", ""], name: "所有文件" },
                ]);

                const libPath = paths.at(0);

                if (!libPath) return;

                await yiqiLib.mutateAsync({ id: row.recId, lib: libPath });
                await handleRestart();
              }}
            >
              <FindInPageOutlined />
            </IconButton>
          }
          disablePadding
        >
          <ListItemButton
            onClick={async () => {
              await yiqiFlag.mutateAsync(row.recId);
              handleRestart();
            }}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={!!row.usedFlag}
                tabIndex={-1}
                disableRipple
              />
            </ListItemIcon>
            <ListItemText
              primary={[row.factoryName || "", row.yqName || ""].join(" - ")}
              secondary={row.dllPath}
            />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="配置QT软件" />
        <CardContent>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();

              form.handleSubmit();
            }}
            onReset={() => {
              form.reset();
            }}
            noValidate
          >
            <Grid container spacing={3}>
              <Grid size={12}>
                <form.Field name="qtAppPath">
                  {(field) => {
                    return (
                      <TextField
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files.item(0);

                          if (!file) return;

                          const path =
                            window.electron.webUtils.getPathForFile(file);
                          field.handleChange(path);
                        }}
                        fullWidth
                        label="软件目录"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => {
                                    selectFile.mutate(
                                      [
                                        {
                                          extensions: ["exe"],
                                          name: "可执行程序",
                                        },
                                        {
                                          extensions: ["*"],
                                          name: "所有文件",
                                        },
                                      ],
                                      {
                                        onError: (error) => {
                                          toast.error(error.message);
                                        },
                                        onSuccess: (paths) => {
                                          const filepath = paths.at(0);

                                          if (!filepath) return;
                                          field.handleChange(filepath);
                                        },
                                      },
                                    );
                                  }}
                                >
                                  <PendingIcon isPending={selectFile.isPending}>
                                    <FindInPageOutlined />
                                  </PendingIcon>
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                </form.Field>
              </Grid>
              <Grid size={12}>
                <form.Field name="qtDataDirectory">
                  {(field) => {
                    return (
                      <TextField
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files.item(0);

                          if (!file) return;

                          const path =
                            window.electron.webUtils.getPathForFile(file);
                          field.handleChange(path);
                        }}
                        fullWidth
                        label="数据库目录"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => {
                                    selectDirectory.mutate(void 0, {
                                      onError: (error) => {
                                        toast.error(error.message);
                                      },
                                      onSuccess: (paths) => {
                                        const filepath = paths.at(0);

                                        if (!filepath) return;
                                        field.handleChange(filepath);
                                      },
                                    });
                                  }}
                                >
                                  <PendingIcon
                                    isPending={selectDirectory.isPending}
                                  >
                                    <FindInPageOutlined />
                                  </PendingIcon>
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                </form.Field>
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions>
          <Button type="submit" form={formId}>
            部署
          </Button>
          <Button
            onClick={() => {
              startApp.mutate();
            }}
            type="button"
          >
            启动
          </Button>
          <Button
            onClick={() => {
              stopApp.mutate();
            }}
            type="button"
          >
            停止
          </Button>
        </CardActions>
      </Card>
      <Card>
        <CardHeader title="仪器配置" />
        <CardContent>
          <List>{renderYiqiConfig()}</List>
        </CardContent>
      </Card>
      {config.isSuccess && <ConfigForm />}
      <UsersTable />
    </Stack>
  );
};
