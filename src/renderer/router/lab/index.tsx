import { createHashRouter, RouterProvider } from "react-router";
import { createRoutes } from "./createRoutes";

const routes = createRoutes();
const router = createHashRouter(routes);

export const LabRouter = () => {
  return <RouterProvider router={router} />;
};
