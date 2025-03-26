import { Typography } from "@mui/material";
import * as channel from "@electron/channel";
import { ipcRenderer } from "@/lib/utils";
import React from "react";
import { QRCodeSVG } from "qrcode.react";

const activatedInfo = ipcRenderer.invoke(channel.getActivateInfo);

export const ActivateCard = () => {
  const info = React.use(activatedInfo);

  return (
    <>
      <Typography>ActivateCard</Typography>
      <QRCodeSVG value={info} />
      <pre>{info}</pre>
    </>
  );
};
