import { Box, Typography } from "@mui/material";
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
      <Box
        sx={{
          padding: 4,
          bgcolor: "white",
        }}
      >
        <QRCodeSVG value={info} />
      </Box>
      <pre>{info}</pre>
    </>
  );
};
