import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  useTheme,
} from "@mui/material";
import React from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";

const useSize = (ref: React.RefObject<HTMLElement | null>) => {
  const [size, setSize] = React.useState<ResizeObserverEntry | null>(null);

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const observer = new ResizeObserver(([entry]) => {
      startTransition(() => {
        setSize(entry);
      });
    });
    observer.observe(div);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return [size, isPending] as const;
};

type Mem = { totalmem: number; freemem: number };
const fetchMem = () =>
  queryOptions<Mem>({
    queryKey: ["window.electronAPI.getMem"],
    async queryFn() {
      const data = await window.electronAPI.getMem();
      return data;
    },
    networkMode: "offlineFirst",
  });

const minmax = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

export const MemCard = () => {
  const [data, setData] = React.useState<Mem[]>([]);
  const [cursorX, setCursorX] = React.useState(0);
  const [showCursor, setShowCursor] = React.useState(false);

  const divRef = React.useRef(null);

  const theme = useTheme();
  const [size] = useSize(divRef);
  const mem = useQuery({
    ...fetchMem(),
    refetchInterval: 200,
    refetchIntervalInBackground: false,
  });

  const width = size?.contentBoxSize.at(0)?.inlineSize || 0;
  const height = 300;

  React.useEffect(() => {
    if (!mem.data) return;

    React.startTransition(() => setData((p) => [...p, mem.data].slice(-width)));
  }, [mem.data, width]);

  const handleCursorChange = (e: React.PointerEvent<HTMLDivElement>) => {
    const hasCapture = e.currentTarget.hasPointerCapture(e.pointerId);

    if (!hasCapture) {
      setShowCursor(false);
      setCursorX(0);
      return;
    }

    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;

    setShowCursor(true);
    setCursorX(minmax(x, 0, width));
  };

  const renderAxis = () => {
    if (!mem.isSuccess) return null;

    return (
      <g>
        <line stroke={theme.palette.divider} x1={0} y1={0} x2={0} y2={height} />
        <line
          stroke={theme.palette.divider}
          x1={0}
          y1={height}
          x2={width}
          y2={height}
        />
        <text
          x={12}
          y={0 + 9}
          z={100}
          fill={theme.palette.action.disabled}
          font-size="12"
          height={9}
        >
          100% ({Number(mem.data.totalmem / 1024 ** 2).toFixed(1) + "G"})
        </text>
        <text
          x={12}
          y={height / 2}
          fill={theme.palette.action.disabled}
          font-size="12"
          z={100}
        >
          50%
        </text>
        <text
          x={12}
          y={height / 4}
          z={100}
          fill={theme.palette.action.disabled}
          font-size="12"
        >
          75%
        </text>
        <text
          x={12}
          y={(height / 4) * 3}
          z={100}
          fill={theme.palette.action.disabled}
          font-size="12"
        >
          25%
        </text>
        <circle cx={0} cy={height} r={4} fill={theme.palette.error.main} />
      </g>
    );
  };

  const renderMemVal = (x: number) => {
    if (!mem.isSuccess) return null;

    const freemem = data.find((i, idx) => {
      void i;
      return Object.is(idx, Math.floor(x));
    })?.freemem;

    if (!freemem) return null;

    return (freemem / 1024 ** 1).toFixed(2);
  };

  const renderCursor = () => {
    if (!showCursor) return null;

    return (
      <g>
        <line
          x1={cursorX}
          x2={cursorX}
          y1={0}
          y2={height}
          stroke={theme.palette.error.main}
          strokeWidth={1}
        />
        <text x={cursorX + 12} y={64} fill={theme.palette.error.main}>
          {renderMemVal(cursorX)}
        </text>
      </g>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Memory"
        action={<Button>{renderMemVal(data.length - 1)}</Button>}
      />
      <CardContent>
        <Box ref={divRef} sx={{ position: "relative", height }}>
          <svg
            height={height}
            width={width}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {renderAxis()}
            <polyline
              points={data
                .map(
                  (i, idx) =>
                    `${idx},${Math.floor(
                      ((i.totalmem - i.freemem) / i.totalmem) * height
                    )}`
                )
                .join(" ")}
              fill="none"
              pointsAtZ={50}
              z={50}
              stroke={theme.palette.primary.main}
              strokeWidth={1}
            />
            {renderCursor()}
          </svg>
          <Box
            sx={{
              touchAction: "none",
              position: "absolute",
              zIndex: (t) => t.zIndex.modal,
              inset: 0,
            }}
            onPointerDown={(e) => {
              if (!e.isPrimary) return;

              e.currentTarget.setPointerCapture(e.pointerId);
              handleCursorChange(e);
            }}
            onPointerMove={handleCursorChange}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              handleCursorChange(e);
            }}
          ></Box>
        </Box>
      </CardContent>
    </Card>
  );
};
