import AppTheme from "#renderer/components/theme/app-theme";
import DialogsProvider from "#renderer/hooks/use-dialogs/dialogs-provider";
import NotificationsProvider from "#renderer/hooks/use-notifications/notifications-provider";
import { CssBaseline } from "@mui/material";
import DashboardLayout from "./components/dashboard-layout";

export const Component = () => {
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <NotificationsProvider>
        <DialogsProvider>
          <DashboardLayout />
        </DialogsProvider>
      </NotificationsProvider>
    </AppTheme>
  );
};
