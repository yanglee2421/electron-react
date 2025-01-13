import { RouterUI } from "./router/RouterUI";
import { QueryProvider } from "./components/query";

export default function App() {
  return (
    <QueryProvider>
      <RouterUI />
    </QueryProvider>
  );
}
