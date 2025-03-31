import { useIndexedStore } from "@/hooks/useIndexedStore";
import {
  BugReportOutlined,
  FileDownloadOutlined,
  FileUploadOutlined,
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
  Box,
  Typography,
  Paper,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useSnackbar } from "notistack";
import { NavMenu } from "@/components/layout";
import { fetchLoginItemSettings, useSetLoginItemSettings } from "./fetchers";
import { useQuery } from "@tanstack/react-query";

const schema = z.object({
  databasePath: z.string().min(1, { message: "数据库路径不能为空" }),
  driverPath: z.string().min(1, { message: "驱动路径不能为空" }),
  home_path: z.string().min(1, { message: "主页路径不能为空" }),
});

type FormValues = z.infer<typeof schema>;

const useSettingForm = (defaultValues: FormValues) =>
  useForm<FormValues>({
    defaultValues,

    resolver: zodResolver(schema),
  });

const reducer = (prev: boolean, action: boolean) => {
  // Present unused variable warning
  void prev;
  return action;
};

export const Component = () => {
  const formId = React.useId();

  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);
  const form = useSettingForm(settings);
  const snackbar = useSnackbar();
  const loginItemSettings = useQuery(fetchLoginItemSettings());
  const setLoginItemSettings = useSetLoginItemSettings();
  const openAtLogin = !!loginItemSettings.data;
  const [optimisticOpenAtLogin, setOptimisticOpenAtLogin] = React.useOptimistic(
    openAtLogin,
    reducer
  );

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
            onSubmit={form.handleSubmit((data) => {
              set((d) => {
                d.settings = { ...d.settings, ...data };
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
                                      window.electronAPI.getPathForFile(file)
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
                                      window.electronAPI.getPathForFile(file)
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
          <Button type="submit" form={formId} startIcon={<SaveOutlined />}>
            保存
          </Button>
          <Button
            component="label"
            startIcon={<FileDownloadOutlined />}
            sx={{ display: "none" }}
          >
            <input
              type="file"
              accept="application/json,.json"
              hidden
              value={""}
              onChange={(e) => {
                const file = e.target.files?.item(0);
                if (!file) return;
                const reader = new FileReader();

                reader.onload = (e) => {
                  console.log(e.target?.result);
                };

                reader.readAsText(file);
              }}
            />
            导入
          </Button>
          <Button
            onClick={() => {
              const data = useIndexedStore.getState();
              const version = useIndexedStore.persist.getOptions().version || 0;
              const jsonString = JSON.stringify(data, null, 2);
              const blob = new Blob([jsonString], {
                type: "application/json",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `backup-v${version}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            startIcon={<FileUploadOutlined />}
            sx={{ display: "none" }}
          >
            导出
          </Button>
        </CardActions>
      </Card>
      <Paper>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 4,
          }}
        >
          <Typography>开机自启</Typography>
          <Switch
            checked={optimisticOpenAtLogin}
            onChange={() => {
              React.startTransition(async () => {
                const nextOpenAtLogin = !openAtLogin;
                setOptimisticOpenAtLogin(nextOpenAtLogin);
                await setLoginItemSettings.mutateAsync(nextOpenAtLogin);
              });
            }}
          />
        </Box>
      </Paper>
    </Stack>
  );
};
