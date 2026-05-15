import { createHashRouter, RouterProvider } from "react-router";
import { routes } from "./routes";

const router = createHashRouter(routes);
export const AppRouter = () => <RouterProvider router={router} />;
