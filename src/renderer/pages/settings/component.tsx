import {
  BugReportOutlined,
  FindInPageOutlined,
  SaveOutlined,
  OpenInNewOutlined,
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
  Switch,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  useUpdateSettings,
  fetchVersion,
  fetchOpenAtLogin,
  useOpenAtLogin,
  useOpenDevTools,
  useSettingsOpenInEditor,
} from "@/api/fetch_preload";
import { flatRoutes } from "@/router/flatRoutes";

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

export const Component = () => {
  const formId = React.useId();

  const form = useSettingForm();
  const mutate = useUpdateSettings();
  const snackbar = useNotifications();
  const queryClient = useQueryClient();
  const updateOpenAtLogin = useOpenAtLogin();
  const version = useQuery(fetchVersion());
  const openAtLogin = useQuery(fetchOpenAtLogin());
  const openDevTools = useOpenDevTools();
  const settingsOpenInEditor = useSettingsOpenInEditor();

  return (
    <Stack spacing={6}>
      <Card>
        <CardHeader
          title="设置"
          action={
            <IconButton
              onClick={() => {
                openDevTools.mutate();
              }}
              disabled={openDevTools.isPaused}
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
              snackbar.show("保存成功", { severity: "success" });
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
                      {flatRoutes.map((i) => (
                        <MenuItem key={i.path} value={i.path}>
                          {i.title}
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
                <CircularProgress size={16} color="inherit" />
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
              settingsOpenInEditor.mutate();
            }}
            disabled={settingsOpenInEditor.isPending}
            startIcon={
              settingsOpenInEditor.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <OpenInNewOutlined />
              )
            }
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
                checked={openAtLogin.data}
                onChange={(e, checked) => {
                  void e;
                  queryClient.setQueryData(
                    fetchOpenAtLogin().queryKey,
                    checked,
                  );
                  updateOpenAtLogin.mutate(checked);
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
