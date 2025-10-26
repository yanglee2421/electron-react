import { RestartAltOutlined } from "@mui/icons-material";
import {
  alpha,
  Box,
  ButtonBase,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  type Theme,
  useTheme,
} from "@mui/material";
import {
  blue,
  brown,
  cyan,
  deepPurple,
  green,
  grey,
  indigo,
  pink,
  red,
  teal,
} from "@mui/material/colors";
import React from "react";
import { useSize } from "#renderer/hooks/dom/useSize";
import { MinesweeperGame } from "./MinesweeperGame";
import { log } from "#renderer/lib/utils";

const map = new Map<number, string>();

const getThemeColorData = (theme: Theme) => {
  map.set(0, alpha(grey[500], theme.palette.action.disabledOpacity));
  map.set(1, alpha(green[500], theme.palette.action.disabledOpacity));
  map.set(2, alpha(blue[500], theme.palette.action.disabledOpacity));
  map.set(3, alpha(indigo[500], theme.palette.action.disabledOpacity));
  map.set(4, alpha(deepPurple[500], theme.palette.action.disabledOpacity));
  map.set(4, alpha(teal[500], theme.palette.action.disabledOpacity));
  map.set(5, alpha(cyan[500], theme.palette.action.disabledOpacity));
  map.set(6, alpha(brown[500], theme.palette.action.disabledOpacity));
  map.set(7, alpha(pink[500], theme.palette.action.disabledOpacity));
  map.set(9, alpha(red[500], theme.palette.action.disabledOpacity));
};

type CellProps = {
  opened: boolean;
  marked: boolean;
  nums: number;
  borderStart?: boolean;
  onOpen(): void;
  onMark(): void;
  error?: boolean;
  disabled: boolean;
};

const Cell = (props: CellProps) => {
  const ref = React.useRef(null);
  const timerRef = React.useRef<NodeJS.Timeout | number>(0);
  const lastPressRef = React.useRef(0);

  const theme = useTheme();
  const [height] = useSize(ref);

  getThemeColorData(theme);

  const render = () => {
    if (props.opened) {
      return props.error ? "X" : props.nums;
    }

    if (props.marked) {
      return "!";
    }

    return;
  };

  const renderColor = () => {
    if (!props.opened) {
      return props.marked ? theme.palette.warning.main : void 0;
    }

    if (props.error) {
      return theme.palette.error.main;
    }

    return map.get(props.nums);
  };

  return (
    <ButtonBase
      ref={ref}
      component={"div"}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerUp={(e) => {
        e.preventDefault();
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (e.pointerType === "mouse") {
          void [
            e.button === 0 && props.onOpen(),
            e.button === 2 && props.onMark(),
          ];

          return;
        }

        const now = Date.now();
        const diff = now - lastPressRef.current;
        clearTimeout(timerRef.current);

        if (diff < 300) {
          props.onOpen();
        } else {
          timerRef.current = setTimeout(props.onMark, 300);
        }

        lastPressRef.current = now;
      }}
      onContextMenu={(e) => e.preventDefault()}
      disabled={props.disabled}
      sx={(t) => ({
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        color: renderColor(),
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: {
          xs: t.typography.body1.fontSize,
          sm: t.typography.h4.fontSize,
        },

        height,

        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "transparent",
        borderBlockStartColor: t.palette.divider,
        borderInlineStartColor: props.borderStart ? t.palette.divider : void 0,

        touchAction: "manipulation",
      })}
    >
      {render()}
    </ButtonBase>
  );
};

const MemoCell = React.memo(Cell);

type GameTimerProps = {
  enable: boolean;
  startTime: number;
  endTime: number;
  isOver: boolean;
  isStarted: boolean;
};

const GameTimer = (props: GameTimerProps) => {
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    if (!props.enable) return;

    let timer = 0;
    const run = () => {
      timer = requestAnimationFrame(run);

      React.startTransition(() => {
        setNow(Date.now());
      });
    };
    run();

    return () => {
      cancelAnimationFrame(timer);
    };
  }, [props.enable]);

  const renderSubheader = () => {
    if (!props.isStarted) {
      return "Standing by";
    }

    let diff = now - props.startTime;

    if (props.isOver) {
      diff = props.endTime - props.startTime;
    }

    const s = Math.floor(diff / 1000);
    const ms = diff % 1000;

    return `${s}s${ms}ms`;
  };

  return renderSubheader();
};

const MemoGameTimer = React.memo(GameTimer);

type ReducerState = {
  game: MinesweeperGame;
};

type ReducerArgs = [number, number, number, () => void, () => void];

const reducer = ({ game }: ReducerState, args?: ReducerArgs) => ({
  game: args ? new MinesweeperGame(...args) : game,
});

export const Component = () => {
  "use no memo";
  const handleTimeStart = () => {
    log("started");
  };

  const handleTimeEnd = () => {
    log("end");
  };

  const [{ game }, dispatch] = React.useReducer(reducer, null, () => ({
    game: new MinesweeperGame(8, 8, 10, handleTimeEnd, handleTimeStart),
  }));
  return (
    <Card
      sx={{
        maxInlineSize: (t) => t.breakpoints.values.sm,
        marginInline: "auto",
        inlineSize: "100%",
      }}
    >
      <CardHeader
        title="Minesweeper"
        subheader={
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              <MemoGameTimer
                enable={game.isRuning}
                isStarted={game.isStarted}
                isOver={game.isOver}
                startTime={game.startTime}
                endTime={game.endTime}
              />
            </span>

            <span>Rest Bombs: {game.restBombs}</span>
          </Box>
        }
        action={
          <IconButton
            onClick={() =>
              React.startTransition(() => {
                dispatch([
                  game.columns,
                  game.rows,
                  game.bombNums,
                  handleTimeEnd,
                  handleTimeStart,
                ]);
              })
            }
          >
            <RestartAltOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              value={`${game.columns},${game.rows},${game.bombNums}`}
              onChange={(e) => {
                const list = e.target.value
                  .split(",")
                  .map((i) => Number.parseInt(i));

                React.startTransition(() => {
                  dispatch([
                    list[0],
                    list[1],
                    list[2],
                    handleTimeEnd,
                    handleTimeStart,
                  ]);
                });
              }}
              fullWidth
              select
              label="Game Mode"
            >
              <MenuItem value="8,8,10">Easy</MenuItem>
              <MenuItem value="9,9,10">Normal</MenuItem>
              <MenuItem value="10,10,16">Hard</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </CardContent>
      <Box
        sx={() => ({
          display: "grid",
          gridTemplateColumns: `repeat(${game.columns},minmax(0,1fr))`,
          gridTemplateRows: `repeat(${game.rows},minmax(0,1fr))`,
          alignItems: "flex-end",
        })}
      >
        {game.cells.map((i, idx) => (
          <MemoCell
            key={i.id}
            opened={game.opened.has(i.id)}
            marked={game.marked.has(i.id)}
            nums={game.getAroundBombs(i).length}
            borderStart={!Object.is(idx % game.columns, 0)}
            onMark={() => {
              game.mark(i.id);
              dispatch();
            }}
            onOpen={() => {
              game.open(i);
              dispatch();
            }}
            error={game.bombs.has(i.id)}
            disabled={game.isOver || game.opened.has(i.id)}
          />
        ))}
      </Box>
    </Card>
  );
};
