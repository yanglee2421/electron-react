import { Layout } from "#renderer/components/layout";
import { Outlet } from "react-router";

export const DashLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export const BlankLayout = () => {
  return <Outlet />;
};