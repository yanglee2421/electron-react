import { createHashRouter, RouterProvider } from "react-router";
import { createRoutes } from "./routes";

const routes = createRoutes();
const router = createHashRouter(routes);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
