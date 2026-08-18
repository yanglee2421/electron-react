import { ArrowUpwardOutlined } from "@mui/icons-material";
import { Fab, Zoom } from "@mui/material";
import React from "react";
import { createPortal } from "react-dom";

const useScrollToTop = () => {
  const [showScrollToTop, setShowScrollToTop] = React.useState(false);

  const anchorEl = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = anchorEl.current;

    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setShowScrollToTop(!entry.isIntersecting);
    });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  return [anchorEl, showScrollToTop] as const;
};

export const ScrollToTopButton = () => {
  const [ref, show] = useScrollToTop();

  return (
    <>
      <div ref={ref}></div>
      {createPortal(
        <Zoom in={show} unmountOnExit>
          <Fab
            sx={{ position: "fixed", bottom: 36, right: 36 }}
            size="small"
            color="primary"
            onClick={() => {
              ref.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              });
            }}
          >
            <ArrowUpwardOutlined />
          </Fab>
        </Zoom>,
        document.body,
      )}
    </>
  );
};
