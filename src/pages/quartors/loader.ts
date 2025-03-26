import { useIndexedStore } from "@/hooks/useIndexedStore";

export const loader = async () => {
  const store = await new Promise((resolve) => {
    useIndexedStore.persist.onFinishHydration(resolve);
  });

  return store;
};
