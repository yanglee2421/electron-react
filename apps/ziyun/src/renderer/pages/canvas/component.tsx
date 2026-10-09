import { useCMDClose, useCMDOpen } from "#renderer/api/cmd";
import { NumberField } from "#renderer/components/number";
import { ipc } from "#renderer/lib/ipc";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
} from "@mui/material";
import React from "react";
import { BehaviorSubject, Observable, tap } from "rxjs";

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
  const [db, setDB] = React.useState(0);

  const ref = React.useRef<HTMLCanvasElement>(null);
  const pointRef = React.useRef<Point>({ x: 0, y: 0 });
  const enabledRef = React.useRef(false);

  const open = useCMDOpen();
  const close = useCMDClose();

  React.useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    const ctx = el.getContext("2d");

    if (!ctx) {
      return;
    }

    const subscription = buffer$
      .pipe(
        tap((value) => {
          console.log(value);
        }),
      )
      .subscribe(list$);

    let raf: number;
    const fn = () => {
      ctx.clearRect(0, 0, 1024, 255);

      const rect = el.getBoundingClientRect();
      const list = list$.getValue();

      ctx.beginPath();
      ctx.strokeStyle = "blue";
      ctx.moveTo(0, 0);
      list.forEach((height, index) => {
        ctx.lineTo(index, 255 - height);
      });
      ctx.stroke();
      ctx.closePath();

      if (enabledRef.current) {
        const x = pointRef.current.x - rect.x;

        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 255);
        ctx.stroke();
        ctx.closePath();

        ctx.font = "14px serif";
        ctx.fillText(x.toString(), x, 255);

        const y = pointRef.current.y - rect.y;
        const height = 255 - y;
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
        ctx.closePath();

        ctx.font = "14px serif";
        ctx.fillText(height.toString(), 0, y);
      }

      raf = requestAnimationFrame(fn);
    };

    fn();

    return () => {
      subscription.unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, []);

  React.useEffect(() => {
    if (db) {
      ipc.invoke("CMD/set-db", db, 0);
    }
  }, [db]);

  return (
    <Box>
      <canvas
        ref={ref}
        width={1024}
        height={255}
        style={{
          border: "1px dashed red",
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
      <Card>
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={12}>
              <NumberField
                field={{
                  value: db,
                  onChange: setDB,
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
