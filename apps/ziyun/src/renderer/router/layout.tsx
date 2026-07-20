import { Layout } from "#renderer/components/layout";
import { useColorScheme } from "#renderer/hooks/dom/useColorScheme";
import { Outlet } from "react-router";
import { ToastContainer } from "react-toastify";

export const DashLayout = () => {
  const isDark = useColorScheme();

  return (
    <Layout>
      <ToastContainer theme={isDark ? "dark" : "light"} />
      <Outlet />
    </Layout>
  );
};

export const BlankLayout = () => {
  return <Outlet />;
};