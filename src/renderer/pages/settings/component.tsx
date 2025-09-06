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
  useProfileUpdate,
  useSelectDirectory,
} from "@/api/fetch_preload";
import { flatRoutes } from "@/router/flatRoutes";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

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
  const profileFormId = React.useId();

  const form = useSettingForm();
  const mutate = useUpdateSettings();
  const snackbar = useNotifications();
  const queryClient = useQueryClient();
  const updateOpenAtLogin = useOpenAtLogin();
  const version = useQuery(fetchVersion());
  const openAtLogin = useQuery(fetchOpenAtLogin());
  const openDevTools = useOpenDevTools();
  const settingsOpenInEditor = useSettingsOpenInEditor();
  const [profileForm] = useProfileForm();
  const selectDirectory = useSelectDirectory();

  return (
    <Stack spacing={3}>
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
            <Grid container spacing={1.5}>
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
      <Card>
        <CardHeader title="启动和退出" />
        <CardContent>
          <form
            id={profileFormId}
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              console.log("submit");

              e.preventDefault();
              e.stopPropagation();
              profileForm.handleSubmit();
            }}
            onReset={() => profileForm.reset()}
          >
            <Grid spacing={3} container>
              <Grid size={{ xs: 12, sm: 6 }}>
                <profileForm.AppField name="appPath">
                  {(appPathField) => (
                    <appPathField.TextField
                      value={appPathField.state.value}
                      onChange={(e) =>
                        appPathField.handleChange(e.target.value)
                      }
                      onBlur={appPathField.handleBlur}
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => {
                                  selectDirectory.mutate(void 0, {
                                    onSuccess(paths) {
                                      const path = paths?.[0];
                                      if (!path) return;
                                      appPathField.handleChange(path);
                                    },
                                  });
                                }}
                              >
                                <FindInPageOutlined />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  )}
                </profileForm.AppField>
              </Grid>
            </Grid>
          </form>
        </CardContent>
        <CardActions>
          <profileForm.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <profileForm.Button
                disabled={!canSubmit}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={12} />
                  ) : (
                    <SaveOutlined />
                  )
                }
                type="submit"
                form={profileFormId}
              >
                保存
              </profileForm.Button>
            )}
          </profileForm.Subscribe>
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
        </List>
      </Paper>
      <Card>
        <CardHeader title="关于" />
        <CardContent>
          <List>
            <ListItem secondaryAction={version.data?.version}>
              <ListItemText primary="版本" />
            </ListItem>
            <ListItem secondaryAction={version.data?.electronVersion}>
              <ListItemText primary="Electron" />
            </ListItem>
            <ListItem secondaryAction={version.data?.chromeVersion}>
              <ListItemText primary="Chrome" />
            </ListItem>
            <ListItem secondaryAction={version.data?.nodeVersion}>
              <ListItemText primary="Node" />
            </ListItem>
            <ListItem secondaryAction={version.data?.v8Version}>
              <ListItemText primary="V8" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
};

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    Button,
  },
});

const profileSchema = z.object({
  appPath: z.string().min(1, { message: "应用路径不能为空" }),
});

const useProfileForm = () => {
  const update = useProfileUpdate();
  const notifications = useNotifications();

  const form = useAppForm({
    defaultValues: {
      appPath: "",
    },
    async onSubmit(props) {
      await update.mutateAsync(
        {
          appPath: props.value.appPath,
        },
        {
          onError: (error) => {
            notifications.show(error.message, { severity: "error" });
          },
          onSuccess: () => {
            notifications.show("保存成功", { severity: "success" });
          },
        },
      );
    },
    validators: {
      onChange: profileSchema,
    },
  });

  return [form, update] as const;
};
