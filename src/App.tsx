import { RouterUI } from "./router/RouterUI";
import { QueryProvider } from "./components/QueryProvider";

export default function App() {
  return (
    <QueryProvider>
      <RouterUI />
    </QueryProvider>
  );
}
