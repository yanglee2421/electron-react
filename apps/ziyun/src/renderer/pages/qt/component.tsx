import { useSelectDirectory, useSelectFile } from "#renderer/api/fetch_preload";
import {
  fetchCurrentLocalDB,
  fetchYiqiConfig,
  useSetupApp,
  useSetYiqiFlag,
  useSetYiqiLib,
  useStartApp,
} from "#renderer/api/qt";
import { PendingIcon } from "#renderer/components/Loading";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { FindInPageOutlined } from "@mui/icons-material";
import {
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
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-toastify";

export const Component = () => {
  const formId = React.useId();

  const setupApp = useSetupApp();
  const startApp = useStartApp();
  const yiqiLib = useSetYiqiLib();
  const yiqiFlag = useSetYiqiFlag();
  const selectFile = useSelectFile();
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
    },
  });

  const renderYiqiConfig = () => {
    if (yiqiConfig.isPending) {
      return null;
    }

    if (yiqiConfig.isError) {
      return null;
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
                  { extensions: ["*"], name: "所有文件" },
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
            <ListItemText primary={row.yqName} secondary={row.dllPath} />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  return (
    <>
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
    </>
  );
};