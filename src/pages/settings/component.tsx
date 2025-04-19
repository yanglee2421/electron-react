import {
  BugReportOutlined,
  FindInPageOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  CardActions,
  Button,
  Stack,
  MenuItem,
  Switch,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useSnackbar } from "notistack";
import { NavMenu } from "@/router/nav";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  useUpdateSettings,
  fetchVersion,
} from "@/api/fetch_preload";

const schema = z.object({
  databasePath: z.string().min(1, { message: "数据库路径不能为空" }),
  driverPath: z.string().min(1, { message: "驱动路径不能为空" }),
  home_path: z.string().min(1, { message: "主页路径不能为空" }),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = () => {
  const { data: settings } = useQuery(fetchSettings());

  if (!settings) {
    throw new Error("Settings not found");
  }

  return useForm<FormValues>({
    defaultValues: {
      home_path: settings.homePath,
      databasePath: settings.databasePath,
      driverPath: settings.driverPath,
    },
    resolver: zodResolver(schema),
  });
};

const reducer = (prev: boolean, action: boolean) => {
  void prev;
  return action;
};

const useOpenAtLogin = () => {
  const [openAtLoginInState, setOpenAtLoginInState] = React.useState<
    null | boolean
  >(null);

  const { data: settings } = useQuery(fetchSettings());
  const queryClient = useQueryClient();

  if (!settings) {
    throw new Error("Settings not found");
  }

  const openAtLoginInUI = openAtLoginInState ?? settings.openAtLogin;

  const [, startTransition] = React.useTransition();
  const [optimisticOpenAtLoginInUI, setOptimisticOpenAtLoginInUI] =
    React.useOptimistic(openAtLoginInUI, reducer);

  const openAtLoginAction = React.useCallback(
    async (checked: boolean) => {
      startTransition(async () => {
        setOptimisticOpenAtLoginInUI(checked);
        await window.electronAPI.settings({
          openAtLogin: checked,
        });
        await queryClient.invalidateQueries({
          queryKey: fetchSettings().queryKey,
        });
        setOpenAtLoginInState(checked);
      });
    },
    [setOptimisticOpenAtLoginInUI, queryClient],
  );

  return [optimisticOpenAtLoginInUI, openAtLoginAction] as const;
};

export const Component = () => {
  const formId = React.useId();
  const [isPending, startTransition] = React.useTransition();

  const form = useSettingForm();
  const mutate = useUpdateSettings();
  const snackbar = useSnackbar();
  const version = useQuery(fetchVersion());
  const [openAtLogin, setOpenAtLogin] = useOpenAtLogin();

  return (
    <Stack spacing={6}>
      <Card>
        <CardHeader
          title="设置"
          action={
            <IconButton
              onClick={() => {
                window.electronAPI.openDevTools();
              }}
            >
              <BugReportOutlined />
            </IconButton>
          }
        />
        <CardContent>
          <form
            id={formId}
            onSubmit={form.handleSubmit(async (data) => {
              mutate.mutate({
                databasePath: data.databasePath,
                driverPath: data.driverPath,
                homePath: data.home_path,
              });
              snackbar.enqueueSnackbar("保存成功", { variant: "success" });
            }, console.warn)}
            onReset={() => form.reset()}
            noValidate
            autoComplete="off"
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="databasePath"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="数据库路径"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton component="label">
                                <input
                                  type="file"
                                  accept="application/msaccess,application/vnd.ms-access,.mdb,.accdb"
                                  hidden
                                  value={""}
                                  onChange={(e) => {
                                    const file = e.target.files?.item(0);
                                    if (!file) return;

                                    field.onChange(
                                      window.electronAPI.getPathForFile(file),
                                    );
                                  }}
                                />
                                <FindInPageOutlined />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="driverPath"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="驱动路径"
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton component="label">
                                <input
                                  type="file"
                                  accept="application/x-msdownload,.exe"
                                  hidden
                                  value={""}
                                  onChange={(e) => {
                                    const file = e.target.files?.item(0);
                                    if (!file) return;

                                    field.onChange(
                                      window.electronAPI.getPathForFile(file),
                                    );
                                  }}
                                />
                                <FindInPageOutlined />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={form.control}
                  name="home_path"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      label="主页路径"
                      select
                    >
                      {NavMenu.list.map((i) => (
                        <MenuItem key={i.to} value={i.to}>
                          {i.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions>
          <Button
            type="submit"
            form={formId}
            startIcon={
              mutate.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <SaveOutlined />
              )
            }
            disabled={mutate.isPending}
          >
            保存
          </Button>
          <Button
            type="button"
            onClick={() => {
              startTransition(window.electronAPI.settingsOpenInEditor);
            }}
            disabled={isPending}
          >
            在编辑器中打开
          </Button>
        </CardActions>
      </Card>
      <Paper>
        <List>
          <ListItem
            secondaryAction={
              <Switch
                checked={openAtLogin}
                onChange={(e, checked) => {
                  void e;
                  setOpenAtLogin(checked);
                }}
              />
            }
          >
            <ListItemText primary="开机自启" />
          </ListItem>
          <ListItem secondaryAction={version.data}>
            <ListItemText primary="版本" />
          </ListItem>
        </List>
      </Paper>
    </Stack>
  );
};
