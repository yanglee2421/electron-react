import {
  fetchIsRunAsAdmin,
  fetchOpenAtLogin,
  fetchVersion,
  useOpenAtLogin,
  useOpenDevTools,
  useSelectDirectory,
} from "#renderer/api/fetch_preload";
import { useProfileStore } from "#renderer/shared/hooks/ui/useProfileStore";
import {
  AdminPanelSettings,
  BugReportOutlined,
  FindInPageOutlined,
  People,
  SaveOutlined,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@toolpad/core";
import React from "react";
import z from "zod";

const profileSchema = z.object({
  appPath: z.string().min(1),
  encoding: z.string().min(1),
});

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
  const notifications = useNotifications();
  const appPath = useProfileStore((state) => state.appPath);
  const encoding = useProfileStore((state) => state.encoding);

  const form = useAppForm({
    defaultValues: {
      appPath,
      encoding,
    },
    async onSubmit({ value }) {
      useProfileStore.setState({
        appPath: value.appPath,
        encoding: value.encoding,
      });
      notifications.show("保存成功", { severity: "success" });
    },
    validators: {
      onChange: profileSchema,
    },
  });

  return form;
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

export const Component = () => {
  const profileFormId = React.useId();

  const queryClient = useQueryClient();
  const updateOpenAtLogin = useOpenAtLogin();
  const version = useQuery(fetchVersion());
  const openAtLogin = useQuery(fetchOpenAtLogin());
  const isRunAsAdmin = useQuery(fetchIsRunAsAdmin());
  const openDevTools = useOpenDevTools();
  const selectDirectory = useSelectDirectory();
  const profileForm = useProfileForm();

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
            <Grid spacing={3} container>
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
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
              onClick={async () => {
                openDevTools.mutate();
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
          <List disablePadding>
            <ListItem
              secondaryAction={
                isRunAsAdmin.data ? (
                  <AdminPanelSettings color="success" />
                ) : (
                  <People color="error" />
                )
              }
            >
              <ListItemText primary="管理员权限" />
            </ListItem>
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
