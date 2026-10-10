import { useCMDClose, useCMDOpen } from "#renderer/api/cmd";
import { NumberField } from "#renderer/components/number";
import { useChannelInputs } from "#renderer/hooks/stores/use-channel-inputs";
import { ipc } from "#renderer/lib/ipc";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  useTheme,
} from "@mui/material";
import React from "react";
import { BehaviorSubject, Observable, animationFrames, tap } from "rxjs";

const list$ = new BehaviorSubject<number[]>([]);
const buffer$ = new Observable<number[]>((sub) => {
  const cleanup = ipc.on("buffer", (_, value: number[]) => {
    sub.next(value);
  });

  return cleanup;
});

interface Point {
  x: number;
  y: number;
}

export const Component = () => {
  const [channel, setChannel] = React.useState("1-0");

  const inputs = useChannelInputs((s) => s.inputs);
  const db = inputs.find((input) => input.channel === channel)?.db || 0;

  const ref = React.useRef<HTMLCanvasElement>(null);
  const pointRef = React.useRef<Point>({ x: 0, y: 0 });
  const enabledRef = React.useRef(false);

  const open = useCMDOpen();
  const close = useCMDClose();
  const theme = useTheme();

  React.useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const ctx = el.getContext("2d");

    if (!ctx) {
      return;
    }

    const subscription = buffer$.subscribe(list$);
    const sub2 = animationFrames()
      .pipe(
        tap(() => {
          ctx.clearRect(0, 0, 1024, 255);

          const rect = el.getBoundingClientRect();
          const list = list$.getValue();

          ctx.beginPath();
          ctx.strokeStyle = theme.palette.primary.main;
          ctx.moveTo(0, 0);
          list.forEach((height, index) => {
            ctx.lineTo(index, 255 - height);
          });
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.closePath();

          if (enabledRef.current) {
            const x = pointRef.current.x - rect.x;

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = theme.palette.divider;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 255);
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = theme.palette.text.primary;
            ctx.font = "14px serif";
            ctx.fillText(x.toString(), x, 255);

            const y = pointRef.current.y - rect.y;
            const height = 255 - y;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = theme.palette.divider;
            ctx.moveTo(0, y);
            ctx.lineTo(1024, y);
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = theme.palette.text.primary;
            ctx.font = "14px serif";
            ctx.fillText(height.toString(), 0, y);
          }
        }),
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      sub2.unsubscribe();
    };
  }, [theme.palette.divider, theme.palette.text.primary]);

  return (
    <Box>
      <Card>
        <CardHeader title="A" />
        <canvas
          ref={ref}
          width={1024}
          height={255}
          style={{
            // width: 500,
            // height: 400,
          }}
          onMouseMove={(e) => {
            pointRef.current = {
              x: e.clientX,
              y: e.clientY,
            };
          }}
          onMouseEnter={() => {
            enabledRef.current = true;
          }}
          onMouseLeave={() => {
            enabledRef.current = false;
          }}
        />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <NumberField
                field={{
                  value: db,
                  onChange: (value) => {
                    useChannelInputs.setState((draft) => {
                      const item = draft.inputs.find(
                        (input) => input.channel === channel,
                      );

                      if (!item) {
                        return;
                      }

                      item.db = value;
                    });
                  },
                  onBlur: () => {},
                }}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            onClick={() => {
              open.mutate();
            }}
          >
            open
          </Button>
          <Button
            onClick={() => {
              close.mutate();
            }}
          >
            close
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};
