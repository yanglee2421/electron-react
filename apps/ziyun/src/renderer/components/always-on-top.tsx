import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { PushPin, PushPinOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export const AlwaysOnTop = () => {
  const alwaysOnTop = useProfileStore((state) => state.alwaysOnTop);

  return (
    <IconButton
      onClick={() => {
        useProfileStore.setState((draft) => {
          draft.alwaysOnTop = !draft.alwaysOnTop;
        });
      }}
    >
      {alwaysOnTop ? <PushPin /> : <PushPinOutlined />}
    </IconButton>
  );
};
