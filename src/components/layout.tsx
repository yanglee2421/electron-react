import {
  alpha,
  AppBar,
  Box,
  IconButton,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  CloseOutlined,
  MenuOutlined,
  DashboardOutlined,
  CalendarMonthOutlined,
  CalendarTodayOutlined,
  SettingsOutlined,
  TrainOutlined,
  ChevronRightOutlined,
} from "@mui/icons-material";
import {
  NavLink,
  useLocation,
  useParams,
  Link as RouterLink,
} from "react-router";
import React from "react";

const LinkWrapper = styled("div")(({ theme }) => ({
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
    label: "现车作业",
    icon: <DashboardOutlined />,
  },
  {
    to: "/verifies",
    label: "日常校验",
    icon: <CalendarTodayOutlined />,
  },
  { to: "/quartors", label: "季度校验", icon: <CalendarMonthOutlined /> },
  { to: "/hmis", label: "HMIS", icon: <TrainOutlined /> },
  {
    to: "/settings",
    label: "设置",
    icon: <SettingsOutlined />,
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

const HEADER_SIZE_XS = 14;
const HEADER_SIZE_SM = 16;
const ASIDE_SIZE = 72;

const AuthAsideWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  zIndex: theme.zIndex.appBar - 1,
  insetInlineStart: 0,
  insetBlockStart: 0,

  inlineSize: "100dvw",
  blockSize: "100dvh",

  paddingBlockStart: theme.spacing(HEADER_SIZE_XS),
  [theme.breakpoints.up("sm")]: {
    maxInlineSize: theme.spacing(ASIDE_SIZE),

    paddingBlockStart: theme.spacing(HEADER_SIZE_SM),
  },

  overflow: "hidden",

  backgroundColor: theme.palette.background.default,
}));

const AuthAside = styled("aside")(({ theme }) => ({
  blockSize: "100%",

  overflowX: "visible",
  overflowY: "auto",
  borderInlineEnd: `1px solid ${theme.palette.divider}`,
}));

const AuthContainer = styled("div")(({ theme }) => ({
  flexDirection: "column",

  minBlockSize: "100dvh",

  paddingBlockStart: theme.spacing(HEADER_SIZE_XS),
  [theme.breakpoints.up("sm")]: {
    display: "flex",

    paddingInlineStart: theme.spacing(ASIDE_SIZE),
    paddingBlockStart: theme.spacing(HEADER_SIZE_SM),
  },
}));

const AuthMain = styled("main")(({ theme }) => ({
  padding: theme.spacing(4),
}));

type AuthLayoutProps = React.PropsWithChildren;

export const AuthLayout = (props: AuthLayoutProps) => {
  const [key, update] = React.useState("");

  const location = useLocation();
  const showMenuInMobile = Object.is(key, location.key);

  return (
    <>
      <AppBar
        elevation={0}
        sx={(theme) => ({
          bgcolor: "transparent",
          borderBlockEnd: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.default, 0.6),
          backdropFilter: "blur(8px)",
        })}
      >
        <Toolbar>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 2.5,
              alignItems: "flex-end",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Typography variant="h6">HMIS/KMIS</Typography>
          </Box>

          <IconButton
            onClick={() =>
              update((p) => (p === location.key ? "" : location.key))
            }
            sx={{ display: { sm: "none" } }}
          >
            {showMenuInMobile ? <CloseOutlined /> : <MenuOutlined />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <AuthAsideWrapper
        sx={{
          maxInlineSize: showMenuInMobile ? "none" : 0,
        }}
      >
        <AuthAside>
          <NavMenu />
        </AuthAside>
      </AuthAsideWrapper>
      <AuthContainer
        sx={{
          display: showMenuInMobile ? "none" : "flex",
        }}
      >
        <AuthMain>{props.children}</AuthMain>
      </AuthContainer>
    </>
  );
};
