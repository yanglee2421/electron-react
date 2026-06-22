import { Box, CircularProgress } from "@mui/material";

export const RootHydrateFallback = () => {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        position: "fixed",
        inset: 0,
      }}
    >
      <CircularProgress />
    </Box>
  );
};
