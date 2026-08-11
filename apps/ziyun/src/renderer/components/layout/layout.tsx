import { Close, Menu, MenuOpen } from "@mui/icons-material";
import {
  Box,
  Container,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { useLocation, useSearchParams } from "react-router";
import { Footer } from "./footer";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const SIDEBAR_SEARCH_KEY = "sidebar";

export const Layout = (props: React.PropsWithChildren) => {
  const [showSidebarInPath, setShowSidebarInPath] = React.useState("");
  const [searchParams, setSearchParams] = useSearchParams({
    [SIDEBAR_SEARCH_KEY]: "1",
  });

  const showSidebarUpSmall = searchParams.get(SIDEBAR_SEARCH_KEY) === "1";
  const theme = useTheme();
  const location = useLocation();
  const isDownSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const showSidebarDownSmall = Object.is(location.pathname, showSidebarInPath);
  const showSidebar = isDownSmall ? showSidebarDownSmall : showSidebarUpSmall;

  return (
    <Box sx={{ "--sidebar-width": theme.spacing(36) }}>
      <Paper
        aria-hidden={!showSidebar}
        component={"aside"}
        sx={{
          position: "fixed",
          zIndex: theme.zIndex.drawer,
          insetBlockStart: 0,

          borderRadius: 0,

          blockSize: "100dvh",

          display: "flex",
          flexDirection: "column",

          [theme.breakpoints.between("xs", "sm")]: {
            insetInlineStart: 0,

            inlineSize: "100%",

            ["&:where([aria-hidden=true])"]: {
              insetInlineStart: "-100%",
              transition: theme.transitions.create("inset-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
            ["&:where([aria-hidden=false])"]: {
              insetInlineStart: 0,
              transition: theme.transitions.create("inset-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          },
          [theme.breakpoints.up("sm")]: {
            inlineSize: "var(--sidebar-width)",

            ["&:where([aria-hidden=true])"]: {
              insetInlineStart: "calc(-1 * var(--sidebar-width))",
              transition: theme.transitions.create("inset-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
            ["&:where([aria-hidden=false])"]: {
              insetInlineStart: 0,
              transition: theme.transitions.create("inset-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          },
        }}
      >
        <Sidebar
          action={
            <IconButton
              onClick={() => {
                setShowSidebarInPath(
                  showSidebarDownSmall ? "" : location.pathname,
                );
              }}
              sx={{ display: { sm: "none" } }}
            >
              <Close />
            </IconButton>
          }
        />
      </Paper>
      <Box
        component={"main"}
        sx={{
          minBlockSize: "100dvh",

          display: "flex",
          flexDirection: "column",

          [theme.breakpoints.between("xs", "sm")]: {
            ["[aria-hidden=true] + &"]: {
              display: "flex",
            },
            ["[aria-hidden=false] + &"]: {
              display: "none",
            },
          },
          [theme.breakpoints.up("sm")]: {
            ["[aria-hidden=true] + &"]: {
              paddingInlineStart: 0,
              transition: theme.transitions.create("padding-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            },
            ["[aria-hidden=false] + &"]: {
              paddingInlineStart: "var(--sidebar-width)",
              transition: theme.transitions.create("padding-inline-start", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          },
        }}
      >
        <Header>
          <IconButton
            onClick={() => {
              if (isDownSmall) {
                setShowSidebarInPath(
                  showSidebarDownSmall ? "" : location.pathname,
                );
              } else {
                setSearchParams((searchParams) => {
                  const previous = searchParams.get(SIDEBAR_SEARCH_KEY);
                  const search = new URLSearchParams(searchParams);

                  search.set(SIDEBAR_SEARCH_KEY, previous === "1" ? "0" : "1");

                  return search;
                });
              }
            }}
          >
            {showSidebar ? <MenuOpen /> : <Menu />}
          </IconButton>
        </Header>
        <Container
          sx={{
            flexGrow: 1,
            flexShrink: 0,
            flexBasis: 0,

            display: "flex",
            flexDirection: "column",
          }}
        >
          {props.children}
          <Footer />
        </Container>
      </Box>
    </Box>
  );
};
