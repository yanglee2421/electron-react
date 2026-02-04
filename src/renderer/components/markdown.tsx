import rehypeShiki from "@shikijs/rehype";
import { MarkdownHooks } from "react-markdown";
import { useColorScheme } from "#renderer/hooks/dom/useColorScheme";
import { Box, Skeleton } from "@mui/material";

type MarkdownProps = {
  code: string;
};

export const Markdown = (props: MarkdownProps) => {
  const isDark = useColorScheme();

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
          <Skeleton animation="wave" />
          <Skeleton animation={false} />
        </Box>
      }
    >
      {props.code}
    </MarkdownHooks>
  );
};
