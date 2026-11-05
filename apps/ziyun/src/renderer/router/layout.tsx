import { Layout } from "#renderer/components/layout";
import { Box } from "@mui/material";
import { Outlet } from "react-router";

export const DashLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export const BlankLayout = () => {
  return (
    <Box
      sx={{ minBlockSize: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <Outlet />
    </Box>
  );
};
