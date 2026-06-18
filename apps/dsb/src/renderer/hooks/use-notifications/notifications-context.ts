import React from "react";
import type { CloseNotification, ShowNotification } from "./use-notification";

const NotificationsContext = React.createContext<{
  show: ShowNotification;
  close: CloseNotification;
} | null>(null);

export default NotificationsContext;
