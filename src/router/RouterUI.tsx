import {
  createHashRouter,
  Outlet,
  RouteObject,
  RouterProvider,
} from "react-router";
import { AuthLayout } from "@/components/layout";
import React from "react";
import { NprogressBar } from "@/components/NprogressBar";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import type { Log } from "@/hooks/useIndexedStore";
import { useLocalStore, useLocalStoreHasHydrated } from "@/hooks/useLocalStore";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { ContentCopyOutlined, FindInPageOutlined } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchActivation } from "@/api/fetchActivation";

const LogWrapper = (props: React.PropsWithChildren) => {
  const set = useIndexedStore((s) => s.set);

  React.useEffect(() => {
    const listener = (data: Log) => {
      set((d) => {
        // Remove logs that are not today
        d.logs = d.logs.filter((i) =>
          dayjs(i.date).isAfter(dayjs().startOf("day"))
        );

        // Add new log
        d.logs.push(data);

        // Deduplicate logs by id
        const map = new Map<string, Log>();
        d.logs.forEach((i) => {
          map.set(i.id, i);
        });
        d.logs = Array.from(map.values());
      });
    };

    const unsubscribe = window.electronAPI.subscribeLog(listener);

    return () => {
      unsubscribe();
    };
  }, [set]);

  return props.children;
};

export const RootRoute = () => {
  return (
    <>
      <NprogressBar />
      <Outlet />
    </>
  );
};

const renderOutlet = (hasHydrated: boolean) => {
  if (!hasHydrated) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Outlet />;
};

const useNativeTheme = () => {
  const mode = useLocalStore((s) => s.mode);

  React.useEffect(() => {
    window.electronAPI.toggleMode(mode);
  }, [mode]);
};

const useAlwaysOnTop = () => {
  const alwaysOnTop = useLocalStore((s) => s.alwaysOnTop);

  React.useEffect(() => {
    window.electronAPI.setAlwaysOnTop(alwaysOnTop);
  }, [alwaysOnTop]);
};

const AuthWrapper = () => {
  useNativeTheme();
  useAlwaysOnTop();
  const hasHydrated = useIndexedStoreHasHydrated();
  const localHasHydrated = useLocalStoreHasHydrated();

  return (
    <AuthLayout>
      <LogWrapper>{renderOutlet(hasHydrated && localHasHydrated)}</LogWrapper>
    </AuthLayout>
  );
};

const motherboardSerial = window.electronAPI.getMotherboardSerial();

const activationSchema = z.object({
  activationCode: z.string().min(1, "激活码不能为空"),
});

const useActivationForm = () =>
  useForm({
    defaultValues: {
      activationCode: "",
    },
    resolver: zodResolver(activationSchema),
  });

const ActivationForm = () => {
  const motherboardSerialString = React.use(motherboardSerial);

  const formId = React.useId();

  const [isPending, startTransition] = React.useTransition();

  const snackbar = useSnackbar();
  const form = useActivationForm();
  const set = useIndexedStore((s) => s.set);

  const code = motherboardSerialString.trim().split("\n").at(-1) || "";

  return (
    <Card>
      <CardHeader title="未激活" subheader="请联系服务人员以激活应用" />
      <CardContent>
        <form
          id={formId}
          onSubmit={form.handleSubmit((data) => {
            set((d) => {
              d.activateCode = data.activationCode;
            });
          }, console.warn)}
        >
          <Grid container spacing={6}>
            <Grid size={12}>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box sx={{ bgcolor: "white", p: 3 }}>
                  <QRCodeSVG value={code} width={256} height={256} />
                </Box>
              </Box>
            </Grid>
            <Grid size={12}>
              <TextField
                label="识别码"
                fullWidth
                value={code}
                onChange={Boolean}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              await navigator.clipboard.writeText(code);
                              snackbar.enqueueSnackbar("复制成功", {
                                variant: "success",
                              });
                            });
                          }}
                        >
                          <ContentCopyOutlined />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                control={form.control}
                name="activationCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    label="激活码"
                    fullWidth
                    rows={1}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton component="label">
                              <FindInPageOutlined />
                              <input
                                type="file"
                                value=""
                                onChange={async (e) => {
                                  const file = e.target.files?.item(0);
                                  if (!file) return;
                                  const text = await file.text();
                                  form.setValue("activationCode", text);
                                  snackbar.enqueueSnackbar("读取成功", {
                                    variant: "success",
                                  });
                                }}
                                hidden
                              />
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
        <Button type="submit" form={formId}>
          激活
        </Button>
      </CardActions>
    </Card>
  );
};

const ActivationGuard = () => {
  const activateCode = useIndexedStore((s) => s.activateCode);

  const activation = useQuery({
    ...fetchActivation(activateCode),
    enabled: !!activateCode,

    retry: false,

    // Disable automatic refetching
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,

    // Disable garbage collection
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!activateCode) {
    return <ActivationForm />;
  }

  if (activation.isPending) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  if (!activation.data.isOk) {
    return <ActivationForm />;
  }

  return <Outlet />;
};

const routes: RouteObject[] = [
  {
    id: "root",
    path: "",
    Component: RootRoute,
    children: [
      {
        id: "404",
        path: "*",
        lazy() {
          return import("@/pages/not-found/route");
        },
      },
      {
        id: "auth_layout",
        Component: AuthWrapper,
        children: [
          {
            id: "home",
            index: true,
            lazy: () => import("@/pages/home/route"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings/route"),
          },
          { id: "log", path: "log", lazy: () => import("@/pages/log/route") },
          {
            id: "activate",
            path: "",
            Component: ActivationGuard,
            children: [
              {
                id: "detection",
                path: "detection",
                lazy: () => import("@/pages/detection/route"),
              },

              {
                id: "quartors",
                path: "quartors",
                lazy: () => import("@/pages/quartors/route"),
              },

              {
                id: "hxzy_hmis",
                path: "hxzy_hmis",
                lazy: () => import("@/pages/hxzy_hmis/route"),
              },
              {
                id: "hxzy_hmis_setting",
                path: "hxzy_hmis_setting",
                lazy: () => import("@/pages/hxzy_hmis_setting/route"),
              },
              {
                id: "hxzy_verifies",
                path: "hxzy_verifies",
                lazy: () => import("@/pages/hxzy_verifies/route"),
              },
              {
                id: "jtv_hmis",
                path: "jtv_hmis",
                lazy: () => import("@/pages/jtv_hmis/route"),
              },
              {
                id: "jtv_hmis_setting",
                path: "jtv_hmis_setting",
                lazy: () => import("@/pages/jtv_hmis_setting/route"),
              },
              {
                id: "jtv_hmis_xuzhoubei",
                path: "jtv_hmis_xuzhoubei",
                lazy: () => import("@/pages/jtv_hmis_xuzhoubei/route"),
              },
              {
                id: "jtv_hmis_xuzhoubei_setting",
                path: "jtv_hmis_xuzhoubei_setting",
                lazy: () => import("@/pages/jtv_hmis_xuzhoubei_setting/route"),
              },
              {
                id: "kh_hmis",
                path: "kh_hmis",
                lazy: () => import("@/pages/kh_hmis/route"),
              },
              {
                id: "kh_hmis_setting",
                path: "kh_hmis_setting",
                lazy: () => import("@/pages/kh_hmis_setting/route"),
              },
            ],
          },
        ],
      },
    ],
  },
];

const router = createHashRouter(routes);

export const RouterUI = () => {
  return <RouterProvider router={router} />;
};
