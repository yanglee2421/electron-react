import type { BoxProps, CircularProgressProps } from "@mui/material";
import { Box, CircularProgress } from "@mui/material";

interface LoadingProps {
  slotProps?: {
    box?: BoxProps;
    circularProgress?: CircularProgressProps;
  };
}

export const Loading = (props: LoadingProps) => {
  const { slotProps = {} } = props;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 6,
      }}
      {...slotProps.box}
    >
      <CircularProgress {...slotProps.circularProgress} />
    </Box>
  );
};

interface PendingIconProps {
  isPending?: boolean;
  size?: number;
  color?: React.ComponentProps<typeof CircularProgress>["color"];
  children?: React.ReactNode;
}

export const PendingIcon = (props: PendingIconProps) => {
  const { size = 16, color } = props;

  if (props.isPending) {
    return <CircularProgress size={size} color={color} />;
  }

  return props.children;
};
