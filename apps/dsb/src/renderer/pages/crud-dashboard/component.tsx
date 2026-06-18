import AppTheme from "#renderer/components/theme/app-theme";
import NotificationsProvider from "#renderer/hooks/use-notifications/notifications-provider";
import { CssBaseline } from "@mui/material";

export const Component = () => {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <NotificationsProvider></NotificationsProvider>
    </AppTheme>
  );
};
