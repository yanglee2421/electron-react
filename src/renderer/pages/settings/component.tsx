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
  Alert,
  AlertTitle,
  Box,
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
  fetchProfile,
} from "@/api/fetch_preload";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const schema = z.object({
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
  const selectDirectory = useSelectDirectory();
  const [profileForm, profileQuery] = useProfileForm();

  const handleDirectoryChange = () => {
    selectDirectory.mutate(void 0, {
      onSuccess(paths) {
        const path = paths?.[0];
        if (!path) return;
        profileForm.setFieldValue("appPath", path);
        profileForm.validateField("appPath", "change");
      },
    });
  };

  const renderForm = () => {
    if (profileQuery.isPending) {
      return (
        <Box display="flex" justifyContent="center" padding={2}>
          <CircularProgress />
        </Box>
      );
    }

    if (profileQuery.isError) {
      return (
        <Alert security="error">
          <AlertTitle>错误</AlertTitle>
          无法加载配置文件: {profileQuery.error?.message}
        </Alert>
      );
    }

    return (
      <>
        <CardContent>
          <form
            id={profileFormId}
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
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
                      disabled={selectDirectory.isPending}
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={handleDirectoryChange}
                                disabled={selectDirectory.isPending}
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
                      label="应用路径"
                      helperText={
                        appPathField.getMeta().errors.length
                          ? appPathField.getMeta().errors.at(0)?.message
                          : "探伤软件的所在路径"
                      }
                      error={appPathField.getMeta().errors.length > 0}
                    />
                  )}
                </profileForm.AppField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <profileForm.AppField name="encoding">
                  {(encodingField) => (
                    <encodingField.TextField
                      value={encodingField.state.value}
                      onChange={(e) =>
                        encodingField.handleChange(e.target.value)
                      }
                      onBlur={encodingField.handleBlur}
                      fullWidth
                      label="编码"
                      helperText={
                        encodingField.getMeta().errors.length
                          ? encodingField.getMeta().errors.at(0)?.message
                          : "使用哪种编码集解析usprofile.ini"
                      }
                      error={encodingField.getMeta().errors.length > 0}
                      select
                    >
                      <MenuItem value="utf-8">utf-8</MenuItem>
                      <MenuItem value="gbk">gbk</MenuItem>
                    </encodingField.TextField>
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
                  <PendingIcon isPending={isSubmitting}>
                    <SaveOutlined />
                  </PendingIcon>
                }
                type="submit"
                form={profileFormId}
              >
                保存
              </profileForm.Button>
            )}
          </profileForm.Subscribe>
        </CardActions>
      </>
    );
  };

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
                driverPath: data.driverPath,
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
            </Grid>
          </form>
        </CardContent>
        <CardActions>
          <Button
            type="submit"
            form={formId}
            startIcon={
              <PendingIcon isPending={mutate.isPending} color="inherit">
                <SaveOutlined />
              </PendingIcon>
            }
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
              <PendingIcon
                isPending={settingsOpenInEditor.isPending}
                color="inherit"
              >
                <OpenInNewOutlined />
              </PendingIcon>
            }
          >
            在编辑器中打开
          </Button>
        </CardActions>
      </Card>
      <Card>
        <CardHeader
          title="设置（实验性）"
          action={
            <IconButton
              onClick={async () => {
                const ini = await window.electron.ipcRenderer.invoke("ini");
                console.log(ini);
              }}
            >
              <BugReportOutlined />
            </IconButton>
          }
        />
        {renderForm()}
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
  encoding: z.string().min(1, { message: "编码不能为空" }),
});

const useProfileForm = () => {
  const profileUpdate = useProfileUpdate();
  const notifications = useNotifications();
  const profileQuery = useQuery(fetchProfile());

  const form = useAppForm({
    defaultValues: {
      appPath: profileQuery.data?.appPath || "",
      encoding: profileQuery.data?.encoding || "",
    },
    async onSubmit(props) {
      await profileUpdate.mutateAsync(
        {
          appPath: props.value.appPath,
          encoding: props.value.encoding,
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

  return [form, profileQuery, profileUpdate] as const;
};

type PendingIconProps = React.PropsWithChildren<{
  isPending?: boolean;
  size?: number;
  color?: React.ComponentProps<typeof CircularProgress>["color"];
}>;

const PendingIcon = (props: PendingIconProps) => {
  const { size = 16, color } = props;

  if (props.isPending) {
    return <CircularProgress size={size} color={color} />;
  }

  return props.children;
};
