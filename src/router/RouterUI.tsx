import {
  createHashRouter,
  Navigate,
  Outlet,
  RouteObject,
  RouterProvider,
  useLocation,
  useParams,
  NavLink,
} from "react-router";
import { MuiProvider } from "@/components/mui";
import { AuthLayout } from "@/components/layout";
import * as channel from "@electron/channel";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Skeleton,
  Snackbar,
  IconButton,
  Icon,
  Typography,
  Box,
  alpha,
  styled,
  Link,
} from "@mui/material";
import {
  GitHub,
  ChatOutlined,
  ChevronRightOutlined,
  DashboardOutlined,
  ScienceOutlined,
} from "@mui/icons-material";
import { useStore } from "@/hooks/useStore";
import React from "react";
import * as conf from "@/lib/conf";

const LANGS = new Set(["en", "zh"]);
const FALLBACK_LANG = "en";
const getMatchedLang = (path = "", state: string) => {
  if (LANGS.has(path)) {
    return path;
  }

  if (LANGS.has(state)) {
    return state;
  }

  return FALLBACK_LANG;
};

export const LangWrapper = (props: React.PropsWithChildren) => {
  const params = useParams();
  const location = useLocation();
  const matchedLang = getMatchedLang(params.lang, "zh");

  if (matchedLang !== params.lang) {
    return (
      <Navigate
        to={{
          pathname: `/${matchedLang + location.pathname}`,
          search: location.search,
          hash: location.hash,
        }}
        state={location.state}
        replace
      />
    );
  }

  return props.children;
};

export const RootRoute = () => {
  return (
    <MuiProvider>
      <LangWrapper>
        <Outlet />
      </LangWrapper>
    </MuiProvider>
  );
};

const Heartbeat = () => {
  const settings = useIndexedStore((s) => s.settings);
  const heartbeat = useQuery({
    ...fetchHeartbeat({
      dsn: settings.databaseDsn,
      path: settings.databasePath,
      password: settings.databasePassword,
    }),
    refetchInterval(query) {
      if (query.state.error) {
        return false;
      }

      return settings.refetchInterval;
    },
  });

  if (heartbeat.isPending) {
    return (
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
  }

  if (heartbeat.isError) {
    return (
      <Alert severity="error">
        <AlertTitle>Connect to Database failed</AlertTitle>
        <p>{heartbeat.error.message}</p>
        <Button component={NavLink} to={{ pathname: "settings" }} color="error">
          Settings
        </Button>
      </Alert>
    );
  }

  return <Outlet />;
};

const AuthWrapper = () => {
  const [key, update] = React.useState("");

  const location = useLocation();
  const showMenuInMobile = Object.is(key, location.key);
  const hasHydrated = useIndexedStoreHasHydrated();
  const msg = useStore((s) => s.msg);
  const set = useStore((s) => s.set);

  return (
    <AuthLayout
      aside={<NavMenu />}
      header={header}
      footer={footer}
      logo={logo}
      showMenuInMobile={showMenuInMobile}
      onShowMenuInMobileChange={() => {
        update((prev) => (prev === location.key ? "" : location.key));
      }}
    >
      {hasHydrated ? <Outlet /> : <CircularProgress />}
      <Snackbar
        open={!!msg}
        autoHideDuration={1000 * 6}
        message={msg}
        onClose={() =>
          set((s) => {
            s.msg = "";
          })
        }
      />
    </AuthLayout>
  );
};

const fetchHeartbeat = (params: channel.DbParamsBase) =>
  queryOptions({
    queryKey: [channel.heartbeat, params],
    queryFn() {
      return ipcRenderer.invoke(channel.heartbeat, params);
    },
  });

const FULL_YEAR = new Date().getFullYear();

const logo = (
  <>
    <Icon fontSize="large" color="primary"></Icon>
    <Typography
      component={"span"}
      variant="h6"
      sx={{
        fontSize: (t) => t.spacing(5),
        fontWeight: 600,
        textTransform: "uppercase",
        color: (t) => t.palette.text.primary,
      }}
    >
      github io
    </Typography>
  </>
);

const header = (
  <>
    <Box sx={{ marginInlineStart: "auto" }}></Box>

    <IconButton href={conf.GITHUB_URL} target={conf.GITHUB_URL}>
      <GitHub />
    </IconButton>
  </>
);

const footer = (
  <>
    &copy; {FULL_YEAR} by{" "}
    <Link href={conf.GITHUB_URL} target={conf.GITHUB_URL}>
      yanglee2421
    </Link>
  </>
);

export const LinkWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),

  "& a": {
    textDecoration: "none",
    color: theme.palette.text.primary,

    display: "flex",
    gap: theme.spacing(3),
    alignItem: "center",

    padding: theme.spacing(5),

    [theme.breakpoints.up("sm")]: {
      paddingInline: theme.spacing(3),
      paddingBlock: theme.spacing(3),
    },
  },
  "& a:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "& a[aria-current=page]": {
    color: theme.palette.primary.main,
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.action.activatedOpacity
    ),
  },
}));

const list = [
  {
    to: "/",
    label: "Home",
    icon: <DashboardOutlined />,
  },
  {
    to: "/verifies",
    label: "Verifies",
    icon: <DashboardOutlined />,
  },
  { to: "/quartors", label: "Quartors", icon: <ChatOutlined /> },
  {
    to: "/settings",
    label: "Settings",
    icon: <ScienceOutlined />,
  },
];

export const NavMenu = () => {
  const params = useParams();

  return (
    <LinkWrapper>
      {list.map((i) => (
        <NavLink key={i.to} to={`/${params.lang + i.to}`} end>
          {i.icon}
          <Typography variant="body1" component="span">
            {i.label}
          </Typography>
          <ChevronRightOutlined sx={{ marginInlineStart: "auto" }} />
        </NavLink>
      ))}
    </LinkWrapper>
  );
};

const routes: RouteObject[] = [
  {
    id: "root",
    path: ":lang?",
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
            id: "heartbeat",
            path: "",
            Component: Heartbeat,
            children: [
              {
                id: "home",
                index: true,
                lazy: () => import("@/pages/home/route"),
              },
              {
                id: "verifies",
                path: "verifies",
                lazy: () => import("@/pages/verifies/route"),
              },
              {
                id: "quartors",
                path: "quartors",
                lazy: () => import("@/pages/quartors/route"),
              },
            ],
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings/route"),
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
