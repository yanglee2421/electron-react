import {
  Box,
  type BoxProps,
  CircularProgress,
  type CircularProgressProps,
} from "@mui/material";

type LoadingProps = {
  slotProps?: {
    box?: BoxProps;
    circularProgress?: CircularProgressProps;
  };
};

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
