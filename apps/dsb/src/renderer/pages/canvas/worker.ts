import { animationFrames, filter, fromEventPattern, map } from "rxjs";

interface CursorState {
  channel: string;
  x: number;
  y: number;
}

interface Gate {
  x: number;
  y: number;
  width: number;
}

interface ChartState {
  canvas: OffscreenCanvas;
  gates: Gate[];
  buffer: Uint8Array;
}

const renderChartFrame = (
  channel: string,
  chart: ChartState,
  cursor: CursorState,
) => {
  const canvas = chart.canvas;
  const ctx = canvas.getContext("2d");
  const list = chart.buffer;

  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  list.forEach((height, index) => {
    ctx.lineTo(index, canvas.height - height);
  });
  ctx.stroke();

  ctx.strokeStyle = "red";
  for (const gate of chart.gates) {
    ctx.beginPath();
    ctx.moveTo(gate.x, canvas.height - gate.y);
    ctx.lineTo(gate.x + gate.width, canvas.height - gate.y);
    ctx.stroke();
  }

  if (channel === cursor.channel) {
  }
};

const message$ = fromEventPattern<MessageEvent<any>>(
  (h) => self.addEventListener("message", h),
  (h) => self.removeEventListener("message", h),
);
// const messageerror$ = fromEventPattern<MessageEvent<any>>(
//   (h) => self.addEventListener("messageerror", h),
//   (h) => self.removeEventListener("messageerror", h),
// );

const animate$ = animationFrames();
const chartState = new Map<string, ChartState>();
const cursorState: CursorState = {
  channel: "",
  x: 0,
  y: 0,
};

interface SetCursorActiion {
  type: "set-cursor";
  payload: CursorState;
}

interface SetBufferAction {
  type: "set-buffer";
  payload: {
    channel: string;
    buffer: Uint8Array;
  };
}

interface SetGateAction {
  type: "set-gate";
  payload: {
    channel: string;
    gates: Gate[];
  };
}

interface SetCanvasAction {
  type: "set-canvas";
  payload: {
    channel: string;
    canvas: OffscreenCanvas;
  };
}

interface RemoveCanvasAction {
  type: "remove-canvas";
  payload: { channel: string };
}

export type MessageAction =
  | SetBufferAction
  | SetGateAction
  | SetCanvasAction
  | RemoveCanvasAction
  | SetCursorActiion;

const cursorChange$ = message$.pipe(
  filter((e) => {
    const type = e.data.type;

    return type === "set-cursor";
  }),
  map((e) => {
    const data: SetCursorActiion = e.data;

    return data.payload;
  }),
);

const bufferChange$ = message$.pipe(
  filter((e) => {
    const type = e.data.type;

    return type === "set-buffer";
  }),
  map((e) => {
    const data: SetBufferAction = e.data;

    return data.payload;
  }),
);

const gateChange$ = message$.pipe(
  filter((e) => {
    const type = e.data.type;

    return type === "set-gate";
  }),
  map((e) => {
    const data: SetGateAction = e.data;

    return data.payload;
  }),
);

const canvasChange$ = message$.pipe(
  filter((e) => {
    const type = e.data.type;

    return type === "set-canvas";
  }),
  map((e) => {
    const data: SetCanvasAction = e.data;

    return data.payload;
  }),
);

cursorChange$.subscribe((state) => {
  cursorState.channel = state.channel;
  cursorState.x = state.x;
  cursorState.y = state.y;
});

bufferChange$.subscribe((state) => {
  const prev = chartState.get(state.channel);

  if (!prev) {
    return;
  }

  chartState.set(state.channel, { ...prev, buffer: state.buffer });
});

gateChange$.subscribe((state) => {
  const prev = chartState.get(state.channel);

  if (!prev) {
    return;
  }

  chartState.set(state.channel, { ...prev, gates: state.gates });
});

canvasChange$.subscribe((state) => {
  const prev = chartState.get(state.channel);

  if (!prev) {
    chartState.set(state.channel, {
      canvas: state.canvas,
      gates: [],
      buffer: new Uint8Array(),
    });
    return;
  }

  chartState.set(state.channel, { ...prev, canvas: state.canvas });
});

animate$.subscribe(() => {
  chartState.forEach((state, channel) => {
    renderChartFrame(channel, state, cursorState);
  });
});
