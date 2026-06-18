import React from "react";
import type { CloseDialog, OpenDialog } from "./use-dialogs";

const DialogsContext = React.createContext<{
  open: OpenDialog;
  close: CloseDialog;
} | null>(null);

export default DialogsContext;
