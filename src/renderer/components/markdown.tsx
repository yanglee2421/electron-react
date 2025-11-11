import rehypeShiki from "@shikijs/rehype";
import { MarkdownHooks } from "react-markdown";
import { useIsDark } from "#renderer/hooks/dom/useIsDark";
import { Box, Skeleton } from "@mui/material";

type MarkdownProps = {
  code: string;
};

export const Markdown = (props: MarkdownProps) => {
  const isDark = useIsDark();

  return (
    <MarkdownHooks
      rehypePlugins={[
        [
          rehypeShiki,
          {
            theme: isDark ? "dark-plus" : "light-plus",
          },
        ],
      ]}
      fallback={
        <Box>
          <Skeleton />
        </Box>
      }
    >
      {props.code}
    </MarkdownHooks>
  );
};
