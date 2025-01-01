import { Navigate, useLocation } from "react-router";
import { login_path, redirect_key } from "@/lib/utils";

export const NavigateToLogin = () => {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  search.set(redirect_key, location.pathname);

  return (
    <Navigate
      to={{
        pathname: login_path,
        search: search.toString(),
        hash: location.hash,
      }}
      replace
    />
  );
};
