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
      display="flex"
      justifyContent="center"
      alignItems="center"
      padding={6}
      {...slotProps.box}
    >
      <CircularProgress {...slotProps.circularProgress} />
    </Box>
  );
};
