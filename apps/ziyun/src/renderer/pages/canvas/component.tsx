import { NumberField } from "#renderer/components/number";
import { useChannelInputs } from "#renderer/hooks/stores/use-channel-inputs";
import { ipc } from "#renderer/lib/ipc";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  Stack,
  Switch,
  useTheme,
} from "@mui/material";
import React from "react";
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  animationFrameScheduler,
  animationFrames,
  auditTime,
  fromEvent,
  map,
  merge,
  switchMap,
} from "rxjs";

interface Point {
  x: number;
  y: number;
}

const useBufferChartRef = (channel: string) => {
  const ref = React.useRef<HTMLCanvasElement>(null);

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

    const ipc$ = new Observable<number[]>((sub) => {
      const cleanup = ipc.on(`buffer:${channel}`, (_, value: number[]) => {
        sub.next(value);
      });

      return cleanup;
    });
    const mouseMove$ = fromEvent<MouseEvent>(el, "mousemove");
    const mouseEnter$ = fromEvent<MouseEvent>(el, "mouseenter");
    const mouseLeave$ = fromEvent<MouseEvent>(el, "mouseleave");
    const showAxis$ = new BehaviorSubject<boolean>(false);
    const buffer$ = new BehaviorSubject<number[]>([]);
    const point$ = new BehaviorSubject<Point>({ x: 0, y: 0 });

    const sub = merge(
      mouseEnter$.pipe(map(() => true)),
      mouseLeave$.pipe(map(() => false)),
    ).subscribe(showAxis$);

    const sub0 = showAxis$
      .pipe(
        switchMap((enter) => {
          if (!enter) {
            return EMPTY;
          }

          return mouseMove$;
        }),
        auditTime(0, animationFrameScheduler),
        map((e) => ({ x: e.clientX, y: e.clientY })),
      )
      .subscribe(point$);

    const sub1 = ipc$.subscribe(buffer$);

    const sub2 = animationFrames().subscribe(() => {
      ctx.clearRect(0, 0, 1024, 255);

      const rect = el.getBoundingClientRect();
      const list = buffer$.getValue();

      ctx.beginPath();
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.moveTo(0, 0);
      list.forEach((height, index) => {
        ctx.lineTo(index, 255 - height);
      });
      ctx.stroke();

      if (showAxis$.getValue()) {
        const point = point$.getValue();
        const x = Math.floor(point.x - rect.x);
        const y = Math.floor(point.y - rect.y);
        const height = 255 - y;

        ctx.strokeStyle = theme.palette.error.main;
        ctx.fillStyle = theme.palette.text.primary;
        ctx.font = "14px serif";

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 255);
        ctx.stroke();
        ctx.fillText(x.toString(), x, 255);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
        ctx.fillText(height.toString(), 0, y);
      }
    });

    const subscritions = [sub, sub0, sub1, sub2];

    return () => {
      subscritions.forEach((sub) => {
        sub.unsubscribe();
      });
    };
  }, [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.text.primary,
  ]);

  return ref;
};

interface BufferChartProps {
  channel: string;
}

const BufferChart = (props: BufferChartProps) => {
  const ref = useBufferChartRef(props.channel);

  const inputs = useChannelInputs((s) => s.inputs);
  const input = inputs.find((input) => Object.is(input.channel, props.channel));
  const db = input?.db || 0;
  const enabled = input?.enabled || false;

  return (
    <Card>
      <CardHeader
        title={input?.channel}
        action={
          <Switch
            checked={enabled}
            onChange={(_, checked) => {
              useChannelInputs.setState((draft) => {
                const input = draft.inputs.find((input) =>
                  Object.is(input.channel, props.channel),
                );

                if (input) {
                  input.enabled = checked;
                }
              });
            }}
          />
        }
      />
      <canvas
        ref={ref}
        width={1024}
        height={255}
        style={{
          // width: 500,
          // height: 400,
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
                    const input = draft.inputs.find((input) =>
                      Object.is(input.channel, props.channel),
                    );

                    if (input) {
                      input.db = value;
                    }
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
            useChannelInputs.setState((draft) => {
              draft.open = true;
            });
          }}
        >
          open
        </Button>
        <Button
          onClick={() => {
            useChannelInputs.setState((draft) => {
              draft.open = false;
            });
          }}
        >
          close
        </Button>
      </CardActions>
    </Card>
  );
};

export const Component = () => {
  const inputs = useChannelInputs((s) => s.inputs);

  return (
    <Stack spacing={1.5}>
      {inputs.map((input) => {
        return <BufferChart channel={input.channel} key={input.channel} />;
      })}
    </Stack>
  );
};
