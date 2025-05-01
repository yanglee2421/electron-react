import {
  queryOptions,
  useMutation,
  usePrefetchQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSnackbar } from "notistack";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  useTheme,
  GlobalStyles,
  Alert,
  AlertTitle,
  Typography,
  AppBar,
  alpha,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import {
  CloseOutlined,
  ContentCopyOutlined,
  ContentPasteOutlined,
  DarkModeOutlined,
  DesktopWindowsOutlined,
  HomeOutlined,
  LightModeOutlined,
  MenuOutlined,
  PhonelinkOutlined,
  PushPin,
  PushPinOutlined,
} from "@mui/icons-material";
import {
  createHashRouter,
  RouteObject,
  RouterProvider,
  Outlet,
  useNavigation,
  useRouteError,
  isRouteErrorResponse,
  Link,
  ScrollRestoration,
  useLocation,
} from "react-router";
import NProgress from "nprogress";
import { Loading } from "@/components/Loading";
import { NavMenu } from "./nav";
import { QueryProvider } from "@/components/query";
import {
  fetchHxzyHmisSetting,
  fetchJtvHmisSetting,
  fetchJtvHmisXuzhoubeiSetting,
  fetchKhHmisSetting,
  fetchSettings,
  useMobileMode,
  useUpdateSettings,
} from "@/api/fetch_preload";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ScrollView } from "@/components/scrollbar";

const renderModeIcon = (mode: string) => {
  switch (mode) {
    case "light":
      return <LightModeOutlined />;
    case "dark":
      return <DarkModeOutlined />;
    case "system":
    default:
      return <DesktopWindowsOutlined />;
  }
};

const ModeToggle = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const fetcher = fetchSettings();
  const { data: settings } = useQuery(fetcher);
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  /**
   * Already ensured query data in the loader
   * @see authLayoutLoader
   * But we need to check if the data is valid
   */
  if (!settings) {
    throw new Error("请先加载设置");
  }

  const mode = settings.mode;
  const setMode = (newMode: "system" | "light" | "dark") => {
    queryClient.setQueryData(fetcher.queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        mode: newMode,
      };
    });
    updateSettings.mutate(
      { mode: newMode },
      {
        onError: () => {
          snackbar.enqueueSnackbar("设置失败", {
            variant: "error",
          });
        },
      },
    );
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        {renderModeIcon(mode)}
      </IconButton>
      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("light");
          }}
        >
          <ListItemIcon>
            <LightModeOutlined />
          </ListItemIcon>
          <ListItemText primary="明亮" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("dark");
          }}
        >
          <ListItemIcon>
            <DarkModeOutlined />
          </ListItemIcon>
          <ListItemText primary="黑暗" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("system");
          }}
        >
          <ListItemIcon>
            <DesktopWindowsOutlined />
          </ListItemIcon>
          <ListItemText primary="系统" />
        </MenuItem>
      </Menu>
    </>
  );
};

const MobileModeButton = () => {
  const mobileMode = useMobileMode();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <IconButton
      onClick={() => {
        mobileMode.mutate(!isSmallScreen);
      }}
    >
      <PhonelinkOutlined color={isSmallScreen ? "primary" : void 0} />
    </IconButton>
  );
};

const useSize = (enable: boolean) => {
  const [height, setHeight] = React.useState(0);

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enable) return;

    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        entry.contentBoxSize.forEach((contentBox) => {
          setHeight(contentBox.blockSize);
        });
      });
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [enable]);

  return [height, ref] as const;
};

const AuthLayout = () => {
  const [key, update] = React.useState("");
  const [dragging, setDragging] = React.useState(false);

  const location = useLocation();
  const fetcher = fetchSettings();
  const { data: settings } = useQuery(fetcher);
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [height, ref] = useSize(isSmallScreen);

  const showMenuInMobile = Object.is(key, location.key);
  const alwaysOnTop = settings?.alwaysOnTop;

  const renderMobile = () => {
    if (showMenuInMobile) {
      return (
        <Box sx={{ paddingBlockStart: `${height}px` }}>
          <NavMenu />
        </Box>
      );
    }

    return (
      <Box sx={{ paddingBlockStart: `${height}px` }}>
        <Box sx={{ padding: 4 }}>
          <Outlet />
        </Box>
      </Box>
    );
  };

  const renderPanel = () => {
    if (isSmallScreen) {
      return <ScrollView>{renderMobile()}</ScrollView>;
    }

    return (
      <PanelGroup direction="horizontal" autoSaveId={"layout"}>
        <Panel id="nav" order={1} defaultSize={30} minSize={30}>
          <ScrollView>
            <NavMenu />
          </ScrollView>
        </Panel>
        <PanelResizeHandle onDragging={setDragging}>
          <Box
            sx={{
              blockSize: "100%",
              inlineSize: dragging ? 2 : 1,
              backgroundColor: dragging
                ? theme.palette.primary.main
                : theme.palette.divider,
            }}
          />
        </PanelResizeHandle>
        <Panel id="content" order={2} defaultSize={70} minSize={30}>
          <ScrollView disable_viewport_slot_display_table>
            <Box sx={{ padding: 4 }}>
              <Outlet />
            </Box>
          </ScrollView>
        </Panel>
      </PanelGroup>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", blockSize: "100dvh" }}>
      <AppBar
        ref={ref}
        elevation={0}
        sx={(theme) => ({
          bgcolor: "transparent",
          borderBlockEnd: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.default, 0.6),
          backdropFilter: "blur(8px)",
        })}
        position={isSmallScreen ? "fixed" : "static"}
      >
        <Toolbar>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 2.5,
              alignItems: "flex-end",

              "&>a": {
                textDecoration: "none",
                color: (t) => t.palette.text.primary,
                outline: "none",
              },
            }}
          >
            <Link to="/">
              <Typography variant="h6">武铁紫云接口面板</Typography>
            </Link>
          </Box>

          <IconButton
            onClick={() =>
              update((p) => (p === location.key ? "" : location.key))
            }
            sx={{ display: { sm: "none" } }}
          >
            {showMenuInMobile ? <CloseOutlined /> : <MenuOutlined />}
          </IconButton>
          <Box sx={{ marginInlineStart: "auto" }} />
          <MobileModeButton />
          <IconButton
            onClick={() => {
              queryClient.setQueryData(fetcher.queryKey, (old) => {
                if (!old) return old;
                return {
                  ...old,
                  alwaysOnTop: !old.alwaysOnTop,
                };
              });

              updateSettings.mutate(
                {
                  alwaysOnTop: !alwaysOnTop,
                },
                {
                  onError: () => {
                    snackbar.enqueueSnackbar("设置失败", {
                      variant: "error",
                    });
                  },
                },
              );
            }}
          >
            {alwaysOnTop ? <PushPin /> : <PushPinOutlined />}
          </IconButton>
          <ModeToggle />
        </Toolbar>
      </AppBar>
      {renderPanel()}
    </Box>
  );
};

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

const useActivate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activateCode: string) => {
      const data = await window.electronAPI.settings({
        activateCode,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchActivation().queryKey,
      });
    },
  });
};

const useActivation = () =>
  useQuery({
    ...fetchActivation(),

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

const ActivationForm = () => {
  const formId = React.useId();

  const [isPending, startTransition] = React.useTransition();
  const snackbar = useSnackbar();
  const form = useActivationForm();
  const activate = useActivate();
  const activation = useActivation();

  if (activation.isPending) {
    return <Loading />;
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  const code = activation.data.serial;

  return (
    <Card>
      <CardHeader title="未激活" subheader="请联系服务人员以激活应用" />
      <CardContent>
        <form
          id={formId}
          onSubmit={form.handleSubmit((data) => {
            activate.mutate(data.activationCode, {
              onError: (error) => {
                snackbar.enqueueSnackbar(error.message, {
                  variant: "error",
                });
              },
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
                            <IconButton
                              onClick={async () => {
                                const text =
                                  await navigator.clipboard.readText();
                                field.onChange(text);
                              }}
                            >
                              <ContentPasteOutlined />
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
        <Button type="submit" form={formId} disabled={activate.isPending}>
          激活
        </Button>
      </CardActions>
    </Card>
  );
};

const fetchActivation = () =>
  queryOptions({
    queryKey: ["fetchActivateCode"],
    queryFn: async () => {
      const data = await window.electronAPI.verifyActivation();
      return data;
    },
  });

const ActivationGuard = () => {
  const activation = useActivation();

  if (activation.isPending) {
    return <Loading />;
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  if (!activation.data.isOk) {
    return <ActivationForm />;
  }

  return <Outlet />;
};

const useNprogress = () => {
  const navigation = useNavigation();

  React.useEffect(() => {
    switch (navigation.state) {
      case "submitting":
      case "loading":
        NProgress.start();
        break;
      case "idle":
      default:
        NProgress.done();
    }
  }, [navigation.state]);
};

const NprogressBar = () => {
  const theme = useTheme();
  useNprogress();

  return (
    <GlobalStyles
      styles={{
        "#nprogress": {
          position: "fixed",
          top: 0,
          inlineSize: "100dvw",

          zIndex: theme.zIndex.drawer + 1,
        },
        "#nprogress .bar": {
          backgroundColor: theme.palette.primary.main,
          blockSize: theme.spacing(1),
        },
      }}
    />
  );
};

const usePrefetchActivation = () => usePrefetchQuery(fetchActivation());

const RootRoute = () => {
  usePrefetchActivation();

  return (
    <>
      <NprogressBar />
      <Outlet />
      <ScrollRestoration />
    </>
  );
};

const renderError = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>{error.status}</AlertTitle>
        <Typography>{error.statusText}</Typography>
        <Link to="/">
          <Button startIcon={<HomeOutlined />}>返回首页</Button>
        </Link>
      </Alert>
    );
  }

  if (error instanceof Error) {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>错误</AlertTitle>
        <Typography>{error.message}</Typography>
        <Typography variant="body2">{error.stack}</Typography>
        <Link to="/">
          <Button startIcon={<HomeOutlined />} color="error">
            返回首页
          </Button>
        </Link>
      </Alert>
    );
  }

  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>错误</AlertTitle>
      <Typography>未知错误，请联系服务人员</Typography>
      <Link to="/">
        <Button startIcon={<HomeOutlined />} color="error">
          返回首页
        </Button>
      </Link>
    </Alert>
  );
};

const RootErrorBoundary = () => {
  const error = useRouteError();

  return <Box sx={{ padding: 6 }}>{renderError(error)}</Box>;
};

const authLayoutLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchSettings());
};

const hxzyLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchHxzyHmisSetting());
};

const jtvXuzhoubeiLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchJtvHmisXuzhoubeiSetting());
};

const jtvLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchJtvHmisSetting());
};

const khLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchKhHmisSetting());
};

const routes: RouteObject[] = [
  {
    id: "root",
    Component: RootRoute,
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        id: "404",
        path: "*",
        lazy: () => import("@/pages/not-found/component"),
      },
      {
        id: "auth_layout",
        Component: AuthLayout,
        loader: authLayoutLoader,
        children: [
          {
            id: "home",
            index: true,
            lazy: () => import("@/pages/home/component"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings"),
          },
          {
            id: "log",
            path: "log",
            lazy: () => import("@/pages/log/component"),
          },
          {
            id: "activation_guard",
            Component: ActivationGuard,
            loader: async () => {
              await QueryProvider.queryClient.ensureQueryData(
                fetchActivation(),
              );
            },
            children: [
              {
                id: "detection",
                path: "detection",
                lazy: () => import("@/pages/detection/component"),
              },
              {
                id: "verify",
                path: "verify",
                lazy: () => import("@/pages/verify/component"),
              },
              {
                id: "quartors",
                path: "quartors",
                lazy: () => import("@/pages/quartors/component"),
              },
              {
                id: "hxzy_layout",
                loader: hxzyLoader,
                children: [
                  {
                    id: "hxzy_hmis",
                    path: "hxzy_hmis",
                    lazy: () => import("@/pages/hxzy_hmis/component"),
                  },
                  {
                    id: "hxzy_hmis_setting",
                    path: "hxzy_hmis_setting",
                    lazy: () => import("@/pages/hxzy_hmis_setting/component"),
                  },
                  {
                    id: "hxzy_verifies",
                    path: "hxzy_verifies",
                    lazy: () => import("@/pages/hxzy_verifies/component"),
                  },
                ],
              },
              {
                id: "jtv_layout",
                loader: jtvLoader,
                children: [
                  {
                    id: "jtv_hmis",
                    path: "jtv_hmis",
                    lazy: () => import("@/pages/jtv_hmis/component"),
                  },
                  {
                    id: "jtv_hmis_setting",
                    path: "jtv_hmis_setting",
                    lazy: () => import("@/pages/jtv_hmis_setting/component"),
                  },
                ],
              },
              {
                id: "jtv_hmis_xuzhoubei_layout",
                loader: jtvXuzhoubeiLoader,
                children: [
                  {
                    id: "jtv_hmis_xuzhoubei",
                    path: "jtv_hmis_xuzhoubei",
                    lazy: () => import("@/pages/jtv_hmis_xuzhoubei/component"),
                  },
                  {
                    id: "jtv_hmis_xuzhoubei_setting",
                    path: "jtv_hmis_xuzhoubei_setting",
                    lazy: () =>
                      import("@/pages/jtv_hmis_xuzhoubei_setting/component"),
                  },
                ],
              },
              {
                id: "kh_hmis_layout",
                loader: khLoader,
                children: [
                  {
                    id: "kh_hmis",
                    path: "kh_hmis",
                    lazy: () => import("@/pages/kh_hmis/component"),
                  },
                  {
                    id: "kh_hmis_setting",
                    path: "kh_hmis_setting",
                    lazy: () => import("@/pages/kh_hmis_setting/component"),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const router = createHashRouter(routes);
export const RouterUI = () => <RouterProvider router={router} />;
