import readme from "#renderer/assets/markdown.md?raw";
import { Markdown } from "#renderer/components/markdown";
import { Box } from "@mui/material";

export const Component = () => {
  return (
    <Box
      sx={{
        "& pre.shiki": {
          whiteSpace: "pre-wrap",
        },
      }}
    >
      <Markdown code={readme} />
    </Box>
  );
};
