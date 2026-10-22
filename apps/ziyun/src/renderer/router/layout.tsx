import { Layout } from "#renderer/components/layout";
import { Box } from "@mui/material";
import React from "react";
import { Outlet } from "react-router";

export const DashLayout = () => {
  return (
    <Layout>
      <React.ViewTransition>
        <Outlet />
      </React.ViewTransition>
    </Layout>
  );
};

export const BlankLayout = () => {
  return (
    <Box
      sx={{ minBlockSize: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <React.ViewTransition>
        <Outlet />
      </React.ViewTransition>
    </Box>
  );
};
