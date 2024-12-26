import React from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Button, TextField, Grid2, Box } from "@mui/material";

// Documents contain sections, you can have multiple sections per document, go here to learn more about sections
// This simple example will only contain one section
const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun("Hello World"),
            new TextRun({
              text: "Foo Bar",
              bold: true,
            }),
            new TextRun({
              text: "Github is the best",
              bold: true,
            }),
          ],
        }),
      ],
    },
  ],
});

export const UI = () => {
  const [disabled, setDisabled] = React.useState(false);
  const [dir, setDir] = React.useState("");

  return (
    <Box sx={{ padding: 3 }}>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <TextField
          value={dir}
          onChange={Boolean}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          fullWidth
        />
        <Grid2 size={{ xs: 12 }}>
          <Box sx={{ display: "flex", gap: 3, paddingBlock: 2 }}>
            {dir && (
              <Button
                disabled={disabled}
                onClick={() => {
                  setDisabled(true);
                  window.ipcRenderer.send("printer", dir);
                  window.ipcRenderer.on("printer-standby", () => {
                    setDisabled(false);
                  });
                }}
                variant="outlined"
              >
                printer
              </Button>
            )}
            <Button
              onClick={() => {
                window.ipcRenderer.send("select", {});
                window.ipcRenderer.on("select-standby", (e, data) => {
                  console.log(e, data);
                  setDir(data);
                });
              }}
              variant="outlined"
            >
              select
            </Button>
            <Button
              onClick={async () => {
                const blob = await Packer.toBlob(doc, false);
                const href = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = Date.now() + ".docx";
                link.href = href;
                link.click();
                link.remove();
                URL.revokeObjectURL(href);
              }}
              variant="outlined"
            >
              export
            </Button>
          </Box>
        </Grid2>

        <input
          type="file"
          name=""
          id=""
          onChange={(e) => {
            const f = e.target.files?.item(0);
            if (!f) return;
            console.log(f);
            const reader = new FileReader();

            reader.onload = (e) => {
              console.log(e.target?.result);
            };

            reader.readAsDataURL(f);
          }}
        />
      </Grid2>
    </Box>
  );
};
