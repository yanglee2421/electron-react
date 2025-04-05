import { QueryClient } from "@tanstack/react-query";

export const GITHUB_URL = "https://github.com/yanglee2421";
export const redirect_key = "redirect_path";
export const login_path = "/login";
export const DATE_FORMAT_DATABASE = "YYYY/MM/DD HH:mm:ss";
export const HEADER_SIZE_XS = 14;
export const HEADER_SIZE_SM = 16;
export const ASIDE_SIZE = 72;
export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";

export const cellPaddingMap = new Map<string, "checkbox" | "none" | "normal">([
  ["checkbox", "checkbox"],
]);

export const rowsPerPageOptions = [10, 20, 30];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 2,

      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,

      retry: 1,
      retryDelay(attemptIndex) {
        return Math.min(1000 * 2 ** attemptIndex, 1000 * 8);
      },

      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});
