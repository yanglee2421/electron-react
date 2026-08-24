import { ThemeProvider } from "#renderer/components/theme-provider";
import { AppRouter } from "./router";

export const App = () => {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
};
