import { fetchVersion, useExportDB } from "#renderer/api/app";
import {
  fetchIsRunAsAdmin,
  fetchOpenAtLogin,
  useOpenAtLogin,
  useOpenDevTools,
  useSelectDirectory,
  useSelectFile,
} from "#renderer/api/fetch_preload";
import { PendingIcon } from "#renderer/components/Loading";
import { NumberField } from "#renderer/components/number";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { profile as profileSchema } from "#shared/instances/schema";
import {
  BugReportOutlined,
  DoneAll,
  ExitToApp,
  FindInPageOutlined,
  RemoveDone,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-toastify";

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

const useProfileForm = () => {
  const appPath = useProfileStore((state) => state.appPath);
  const encoding = useProfileStore((state) => state.encoding);
  const externalDBPath = useProfileStore((state) => state.externalDBPath);
  const enableExternalDB = useProfileStore((state) => state.enableExternalDB);
  const enableHMISProxy = useProfileStore((state) => state.enableHMISProxy);
  const hmisProxyPort = useProfileStore((state) => state.hmisProxyPort);

  const form = useAppForm({
    defaultValues: {
      ...useProfileStore.getState(),
      appPath,
      encoding,
      enableExternalDB,
      externalDBPath,
      enableHMISProxy,
      hmisProxyPort,
    },
    onSubmit: async ({ value }) => {
      useProfileStore.setState({
        appPath: value.appPath,
        encoding: value.encoding,
        enableExternalDB: value.enableExternalDB,
        externalDBPath: value.externalDBPath,
        enableHMISProxy: value.enableHMISProxy,
        hmisProxyPort: value.hmisProxyPort,
        enableTray: value.enableTray,
      });
      toast.success("保存成功");
    },
    validators: {
      onChange: profileSchema.required(),
    },
  });

  return form;
};

export const Component = () => {
  const profileFormId = React.useId();

  const queryClient = useQueryClient();
  const updateOpenAtLogin = useOpenAtLogin();
  const openAtLogin = useQuery(fetchOpenAtLogin());
  const isRunAsAdmin = useQuery(fetchIsRunAsAdmin());
  const openDevTools = useOpenDevTools();
  const selectDirectory = useSelectDirectory();
  const profileForm = useProfileForm();
  const version = useQuery(fetchVersion());
  const exportDB = useExportDB();
  const selectFile = useSelectFile();
  const enableTray = useProfileStore((state) => state.enableTray);
  const showHxzyHmisMenu = useProfileStore((s) => s.showHxzyHmisMenu);
  const showJtvHmisMenu = useProfileStore((s) => s.showJtvHmisMenu);
  const showGuangzhoubeiHmisMenu = useProfileStore(
    (s) => s.showGuangzhoubeiHmisMenu,
  );
  const showGuangzhoujibaoduanHmisMenu = useProfileStore(
    (s) => s.showGuangzhoujibaoduanHmisMenu,
  );
  const showKhHmisMenu = useProfileStore((s) => s.showKhHmisMenu);
  const showPLCMenu = useProfileStore((s) => s.showPLCMenu);

  const handleDirectoryChange = () => {
    selectDirectory.mutate(void 0, {
      onSuccess(paths) {
        const path = paths?.[0];
        if (!path) return;
        profileForm.setFieldValue("appPath", path);
        void profileForm.validateField("appPath", "change");
      },
    });
  };

  const handleOpenDevTools = () => {
    openDevTools.mutate();
  };

  const renderForm = () => {
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
              void profileForm.handleSubmit();
            }}
            onReset={() => profileForm.reset()}
          >
            <Grid spacing={1.5} container>
              <Grid size={12}>
                <FormLabel>12通道相关</FormLabel>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <profileForm.AppField name="appPath">
                  {(field) => (
                    <TextField
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
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
                        field.getMeta().errors.length
                          ? field.getMeta().errors.at(0)?.message
                          : "探伤软件的所在路径"
                      }
                      error={field.getMeta().errors.length > 0}
                    />
                  )}
                </profileForm.AppField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <profileForm.AppField name="encoding">
                  {(field) => (
                    <TextField
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      fullWidth
                      label="编码"
                      helperText={
                        field.getMeta().errors.length
                          ? field.getMeta().errors.at(0)?.message
                          : "使用哪种编码集解析usprofile.ini"
                      }
                      error={field.getMeta().errors.length > 0}
                      select
                    >
                      <MenuItem value="utf-8">utf-8</MenuItem>
                      <MenuItem value="gbk">gbk</MenuItem>
                    </TextField>
                  )}
                </profileForm.AppField>
              </Grid>
              <Grid size={12}>
                <FormLabel>统信相关</FormLabel>
              </Grid>
              <Grid size={12}>
                <profileForm.Field name="enableExternalDB">
                  {(field) => {
                    return (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.state.value}
                            onChange={(_, checked) => {
                              field.handleChange(checked);
                            }}
                          />
                        }
                        label="启用外部数据库"
                      />
                    );
                  }}
                </profileForm.Field>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <profileForm.Field name="externalDBPath">
                  {(field) => {
                    return (
                      <TextField
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={selectFile.isPending}
                        fullWidth
                        error={field.getMeta().errors.length > 0}
                        helperText={
                          field.getMeta().errors.length
                            ? field.getMeta().errors.at(0)?.message
                            : "外部数据库的所在路径"
                        }
                        label="外部数据库路径"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => {
                                    selectFile.mutate(
                                      [
                                        {
                                          extensions: ["db"],
                                          name: "数据库文件",
                                        },
                                      ],
                                      {
                                        onSuccess: (paths) => {
                                          const path = paths?.at(0);

                                          if (!path) return;

                                          profileForm.setFieldValue(
                                            "externalDBPath",
                                            path,
                                          );
                                          void profileForm.validateField(
                                            "externalDBPath",
                                            "change",
                                          );
                                        },
                                      },
                                    );
                                  }}
                                  disabled={selectFile.isPending}
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
                </profileForm.Field>
              </Grid>
              <Grid size={12}>
                <profileForm.Field name="enableHMISProxy">
                  {(field) => {
                    return (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.state.value}
                            onChange={(_, checked) => {
                              field.handleChange(checked);
                            }}
                          />
                        }
                        label="启用HMIS代理"
                      />
                    );
                  }}
                </profileForm.Field>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <profileForm.Field name="hmisProxyPort">
                  {(field) => {
                    return (
                      <NumberField
                        field={{
                          value: field.state.value,
                          onChange: field.handleChange,
                          onBlur: field.handleBlur,
                        }}
                        fullWidth
                        error={field.getMeta().errors.length > 0}
                        helperText={
                          field.getMeta().errors.length
                            ? field.getMeta().errors.at(0)?.message
                            : "HMIS代理使用的端口号"
                        }
                        label="HMIS代理服务端口"
                      />
                    );
                  }}
                </profileForm.Field>
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
          <Button
            startIcon={
              <PendingIcon isPending={exportDB.isPending}>
                <ExitToApp />
              </PendingIcon>
            }
            onClick={() => {
              exportDB.mutate();
            }}
            disabled={exportDB.isPending}
          >
            导出
          </Button>
        </CardActions>
      </>
    );
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="基础设置" />
        <List>
          <React.Activity
            mode={
              window.electron.process.platform === "win32"
                ? "visible"
                : "hidden"
            }
          >
            <ListItem
              secondaryAction={
                <Switch
                  checked={openAtLogin.data}
                  onChange={(_, checked) => {
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
          </React.Activity>
          <ListItem
            secondaryAction={
              <Switch
                checked={enableTray}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.enableTray = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"启用系统托盘"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showHxzyHmisMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showHxzyHmisMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示华兴致远HMIS菜单"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showJtvHmisMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showJtvHmisMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示京天威统型HMIS菜单"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showGuangzhoubeiHmisMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showGuangzhoubeiHmisMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示广州北HMIS菜单"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showGuangzhoujibaoduanHmisMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showGuangzhoujibaoduanHmisMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示广州机保段HMIS菜单"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showKhHmisMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showKhHmisMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示康华HMIS菜单"} />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={showPLCMenu}
                onChange={(_, checked) => {
                  useProfileStore.setState((d) => {
                    d.showPLCMenu = checked;
                  });
                }}
              />
            }
          >
            <ListItemText primary={"显示PLC菜单"} />
          </ListItem>
        </List>
      </Card>
      <Card>
        <CardHeader
          title="探伤软件设置"
          action={
            <IconButton onClick={handleOpenDevTools}>
              <BugReportOutlined />
            </IconButton>
          }
        />
        {renderForm()}
      </Card>
      <Card>
        <CardHeader title="关于" />
        <CardContent>
          <List disablePadding>
            <ListItem
              secondaryAction={
                isRunAsAdmin.data ? (
                  <DoneAll color="success" />
                ) : (
                  <RemoveDone color="error" />
                )
              }
            >
              <ListItemText primary="管理员权限" />
            </ListItem>
            <ListItem secondaryAction={version.data}>
              <ListItemText primary="版本" />
            </ListItem>
            <ListItem
              secondaryAction={window.electron.process.versions.electron}
            >
              <ListItemText primary="Electron" />
            </ListItem>
            <ListItem secondaryAction={window.electron.process.versions.chrome}>
              <ListItemText primary="Chrome" />
            </ListItem>
            <ListItem secondaryAction={window.electron.process.versions.node}>
              <ListItemText primary="Node" />
            </ListItem>
            <ListItem secondaryAction={window.electron.process.versions.v8}>
              <ListItemText primary="V8" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
};