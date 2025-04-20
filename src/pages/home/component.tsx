import { fetchSettings } from "@/api/fetch_preload";
import { Alert, AlertTitle, Box, CircularProgress } from "@mui/material";
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
      <Alert>
        <AlertTitle>Error</AlertTitle>
        Load settings failed. Please try again later.
      </Alert>
    );
  }

  return <Navigate to={settings.data.homePath} replace />;
};
