import React from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";

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

export default function App() {
  const [disabled, setDisabled] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [dir, setDir] = React.useState("");

  React.useEffect(() => {
    Packer.toBlob(doc, true).then((res) => {
      setLink(URL.createObjectURL(res));
    });
  }, []);

  return (
    <>
      {dir}
      {dir && (
        <button
          disabled={disabled}
          onClick={() => {
            setDisabled(true);
            window.ipcRenderer.send("printer", dir);
            window.ipcRenderer.on("printer-standby", () => {
              setDisabled(false);
            });
          }}
        >
          printer
        </button>
      )}
      <button
        onClick={() => {
          window.ipcRenderer.send("select", {});
          window.ipcRenderer.on("select-standby", (e, data) => {
            console.log(e, data);
            setDir(data);
          });
        }}
      >
        select
      </button>
      {link && (
        <a href={link} download={`${Date.now()}.docx`}>
          export
        </a>
      )}
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
    </>
  );
}
