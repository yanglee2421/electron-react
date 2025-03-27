import { useIndexedStore } from "@/hooks/useIndexedStore";
import { Navigate } from "react-router";

export const Component = () => {
  const home_path = useIndexedStore((s) => s.settings.home_path);

  return <Navigate to={home_path} replace />;
};
