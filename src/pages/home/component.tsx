import { fetchSettings } from "@/api/fetch_preload";
import { Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";

export const Component = () => {
  const settings = useQuery(fetchSettings());
  if (settings.isPending) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (settings.isError) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
        }}
      >
        <h1>Error</h1>
      </Box>
    );
  }

  return <Navigate to={settings.data.homePath} replace />;
};
