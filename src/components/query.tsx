import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query";

export const QueryProvider = (props: React.PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
};
