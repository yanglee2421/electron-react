import { RouterUI } from "./router/RouterUI";
import { QueryProvider } from "./components/query";
import { MuiProvider } from "@/components/mui";
import { SnackbarProvider } from "notistack";

export default function App() {
  return (
    <QueryProvider>
      <MuiProvider>
        <SnackbarProvider
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={3000}
        >
          <RouterUI />
        </SnackbarProvider>
      </MuiProvider>
    </QueryProvider>
  );
}
