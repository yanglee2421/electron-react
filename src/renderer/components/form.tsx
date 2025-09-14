import { ClearOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";

type ClearInputButtonProps = {
  value: string;
  onClear?: () => void;
};

export const ClearInputAdornment = (props: ClearInputButtonProps) => {
  if (!props.value) return null;
  return (
    <InputAdornment position="end">
      <IconButton onClick={props.onClear}>
        <ClearOutlined />
      </IconButton>
    </InputAdornment>
  );
};
