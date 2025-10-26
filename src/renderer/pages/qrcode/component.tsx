import { QRCodeSVG } from "qrcode.react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import * as consts from "#renderer/lib/constants";
import { LinkOutlined, QrCode2Outlined } from "@mui/icons-material";
import { useQueries } from "@tanstack/react-query";
import type { ElementOf } from "#renderer/lib/utils";
import { fetchBarcodeTextFromImage } from "#renderer/api/pdf";

const PasteInput = () => {
  const [files, setFiles] = React.useState<File[]>([]);

  const inputId = React.useId();

  const queries = useQueries({
    queries: files.map((file) => fetchBarcodeTextFromImage(file)),
  });

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    setFiles([...e.clipboardData.files]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) {
      setFiles([]);
      return;
    }

    setFiles([...fileList]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setFiles([...e.dataTransfer.files]);
  };

  type Query = ElementOf<typeof queries>;

  const renderQuery = (query: Query) => {
    if (query.isPending) {
      return <CircularProgress />;
    }

    if (query.isError) {
      return (
        <Typography color="error">Error: {query.error.message}</Typography>
      );
    }

    return query.data.map((text, index) => (
      <Typography key={index}>{text}</Typography>
    ));
  };

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        onPaste={handlePaste}
        onDrop={handleDrop}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton component="label" htmlFor={inputId}>
                  <input
                    id={inputId}
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    value={""}
                    onChange={handleFileChange}
                  />
                  <LinkOutlined />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        placeholder="Paste or drop an image here to read QR code"
      />
      {queries.map((query) => renderQuery(query))}
    </Stack>
  );
};

export const Component = () => {
  const [qrValue, setQrValue] = React.useState(consts.GITHUB_URL);

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title="Generate QRCode from text" />
        <CardContent>
          <form
            action={async (formData) => {
              const qrInput = formData.get("qrInput") as string;
              setQrValue(qrInput);
            }}
          >
            <Grid container spacing={3}>
              <Grid size={12}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ bgcolor: "white", padding: 3 }}>
                    <QRCodeSVG value={qrValue} width={256} height={256} />
                  </Box>
                </Box>
              </Grid>
              <Grid size={12}>
                <TextField
                  name="qrInput"
                  label="Enter QR Code Value"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="submit">
                            <QrCode2Outlined />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      autoComplete: "off",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Read QRCode from image" />
        <CardContent>
          <PasteInput />
        </CardContent>
      </Card>
    </Stack>
  );
};
