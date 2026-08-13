import { useSelectDirectory, useSelectFile } from "#renderer/api/fetch_preload";
import {
  fetchCurrentLocalDB,
  fetchQTHMISConfig,
  fetchYiqiConfig,
  QUERY_KEY,
  useSetQTHmisConfig,
  useSetupApp,
  useSetYiqiFlag,
  useSetYiqiLib,
  useStartApp,
} from "#renderer/api/qt";
import { Loading, PendingIcon } from "#renderer/components/Loading";
import { NumberField } from "#renderer/components/number";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { FindInPageOutlined, Save } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-toastify";
import { z } from "zod";

const ipv4Schema = z.ipv4().default("0.0.0.0");
const portSchema = z.number().int().min(1).max(65535).default(80);
const schema = z.object({
  ip: ipv4Schema,
  port: portSchema,
});

const HMISCard = () => {
  const formId = React.useId();

  const hmisConfig = useQuery(fetchQTHMISConfig());
  const setHmisConfig = useSetQTHmisConfig();
  const url = URL.canParse(hmisConfig.data?.HMIS_Url || "")
    ? new URL(hmisConfig.data?.HMIS_Url || "")
    : null;

  const form = useForm({
    defaultValues: {
      ip: url?.hostname || "",
      port: url?.port ? Number.parseInt(url.port) : 0,
    },
    validators: {
      onChange: schema.required(),
    },
    onSubmit: async ({ value }) => {
      await setHmisConfig.mutateAsync(
        {
          HMIS_Url: new URL(`http://${value.ip}:${value.port}`).href.replace(
            /\/$/,
            "",
          ),
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
          onSuccess: () => {
            toast.success("保存成功");
          },
        },
      );
    },
  });

  return (
    <Card>
      <CardHeader title="HMIS代理配置" />
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
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="ip">
                {(field) => (
                  <TextField
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors.length}
                    helperText={
                      field.getMeta().errors.length
                        ? field.getMeta().errors.at(0)?.message
                        : "HMIS代理使用的IP地址"
                    }
                    label="IP地址"
                    fullWidth
                  />
                )}
              </form.Field>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <form.Field name="port">
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
              </form.Field>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <CardActions>
        <Button type="submit" form={formId} startIcon={<Save />}>
          保存
        </Button>
      </CardActions>
    </Card>
  );
};

export const Component = () => {
  const formId = React.useId();

  const setupApp = useSetupApp();
  const startApp = useStartApp();
  const yiqiLib = useSetYiqiLib();
  const yiqiFlag = useSetYiqiFlag();
  const selectFile = useSelectFile();
  const queryClient = useQueryClient();
  const selectDirectory = useSelectDirectory();
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

                yiqiLib.mutate({ id: row.recId, lib: libPath });
              }}
            >
              <FindInPageOutlined />
            </IconButton>
          }
          disablePadding
        >
          <ListItemButton
            onClick={() => {
              yiqiFlag.mutate(row.recId);
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
                                          extensions: ["*", ""],
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
            Save
          </Button>
          <Button
            onClick={() => {
              startApp.mutate();
            }}
            type="button"
          >
            start
          </Button>
        </CardActions>
      </Card>
      <Card>
        <CardHeader title="仪器配置" />
        <CardContent>
          <List>{renderYiqiConfig()}</List>
        </CardContent>
        <CardActions></CardActions>
      </Card>
      <HMISCard />
    </Stack>
  );
};
