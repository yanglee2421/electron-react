import React from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Button, TextField, Grid2, Box } from "@mui/material";
import * as channel from "@electron/channel";

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
  const [isPending, startTransition] = React.useTransition();
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
                disabled={isPending}
                onClick={() => {
                  startTransition(() =>
                    window.ipcRenderer.invoke(channel.printer, dir)
                  );
                }}
                variant="outlined"
              >
                printer
              </Button>
            )}
            <Button variant="outlined" component="label">
              <input
                type="file"
                name=""
                hidden
                id=""
                accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                value={""}
                onChange={(e) => {
                  const file = e.target.files?.item(0);
                  if (!file) return;
                  setDir(file.path);
                }}
              />
              select
            </Button>
            <Button
              variant="outlined"
              component="label"
              onClick={() => {
                startTransition(() =>
                  window.ipcRenderer.invoke(channel.openPath, dir)
                );
              }}
              disabled={!dir || isPending}
            >
              open
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
