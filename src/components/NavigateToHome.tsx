import { redirect_key } from "@/lib/utils";
import { Navigate, useLocation } from "react-router";

export const NavigateToHome = () => {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const pathname = search.get(redirect_key) || "/";
  search.delete(redirect_key);

  return (
    <Navigate
      replace
      to={{
        pathname,
        search: search.toString(),
        hash: location.hash,
      }}
    />
  );
};
