import { fetchSettings } from "@/api/fetch_preload";
import { Alert, AlertTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { Loading } from "@/components/Loading";

export const Component = () => {
  const settings = useQuery(fetchSettings());

  if (settings.isPending) {
    return <Loading />;
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
