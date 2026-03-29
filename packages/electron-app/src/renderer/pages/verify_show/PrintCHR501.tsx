import { Print } from "@mui/icons-material";
import { Button } from "@mui/material";
import { createPortal } from "react-dom";

export const PrintCHR501 = () => {
  return (
    <>
      <Button
        startIcon={<Print />}
        variant="outlined"
        onClick={() => {
          window.print();
          //   void window.electron.ipcRenderer.invoke("print");
        }}
      >
        Print
      </Button>
      {createPortal(
        <article>
          <section className="a4">
            <h1>测试页</h1>
            <table>
              <thead></thead>
              <tbody></tbody>
              <tfoot></tfoot>
            </table>
          </section>
          <section className="a4">
            <h1>测试页2</h1>
            <img
              src="file:///C:/Users/lee/Pictures/0a06c2e528ae84714ed1d944914b61e7493630583.jpg"
              alt=""
              style={{
                maxWidth: "100%",
              }}
            />
          </section>
        </article>,
        document.body,
      )}
    </>
  );
};
