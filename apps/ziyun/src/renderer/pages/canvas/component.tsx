import { useChannelInputs } from "#renderer/hooks/stores/use-channel-inputs";
import { ipc } from "#renderer/lib/ipc";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  styled,
  Switch,
} from "@mui/material";
import React from "react";
import type { Subscription } from "rxjs";
import { Observable } from "rxjs";
import { useShallow } from "zustand/shallow";
import type { MessageAction } from "./worker";
import workerPath from "./worker?worker&url";

const Input = styled("input")({
  display: "block",
  width: "100%",
});

interface FrameMessage {
  channel: string;
  buffer: Uint8Array;
}

const frame$ = new Observable<FrameMessage>((sub) => {
  const cleanup = ipc.on(`buffer`, (_, value: FrameMessage) => {
    sub.next(value);
  });

  return cleanup;
});

class WorkerCanvas {
  private readonly worker = new Worker(workerPath, { type: "module" });
  private readonly canvas = new Map<string, HTMLCanvasElement>();
  private readonly subscriptions: Subscription[];

  constructor() {
    const sub1 = frame$.subscribe((frame) => {
      this.sendMessage({
        type: "set-buffer",
        payload: { channel: frame.channel, buffer: frame.buffer },
      });
    });

    this.subscriptions = [sub1];
  }

  dispose() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.canvas.forEach((c) => {
      c.remove();
    });
    this.canvas.clear();
    this.worker.terminate();
  }

  sendMessage(
    action: MessageAction,
    transferable?: StructuredSerializeOptions,
  ) {
    this.worker.postMessage(action, transferable);
  }

  createCanvas(channel: string, parent: Node) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 255;
    const offscreen = canvas.transferControlToOffscreen();
    this.sendMessage(
      { type: "set-canvas", payload: { channel, canvas: offscreen } },
      { transfer: [offscreen] },
    );
    parent.appendChild(canvas);
    this.canvas.set(channel, canvas);
  }

  removeCanvas(channel: string) {
    this.sendMessage({ type: "remove-canvas", payload: { channel } });
    this.getCanvas(channel)?.remove();
    this.canvas.delete(channel);
  }

  getCanvas(channel: string) {
    return this.canvas.get(channel);
  }
}

export const Component = () => {
  const canvasRef = React.useRef<Map<string, HTMLDivElement>>(null);
  const workerRef = React.useRef<WorkerCanvas>(null);

  const inputs = useChannelInputs((s) => s.inputs);
  const interval = useChannelInputs((s) => s.interval);
  const open = useChannelInputs((s) => s.open);
  const channels = useChannelInputs(
    useShallow((s) => s.inputs.map((i) => i.channel)),
  );

  React.useEffect(() => {
    workerRef.current = new WorkerCanvas();

    return () => {
      workerRef.current?.dispose();
    };
  }, []);

  React.useEffect(() => {
    channels.forEach((c) => {
      const canvas = canvasRef.current?.get(c);

      if (canvas) {
        workerRef.current?.createCanvas(c, canvas);
      }
    });

    return () => {
      channels.forEach((c) => {
        workerRef.current?.removeCanvas(c);
      });
    };
  }, [channels]);

  React.useEffect(() => {
    inputs.forEach((input) => {
      workerRef.current?.sendMessage({
        type: "set-gate",
        payload: {
          channel: input.channel,
          gates: input.gates,
        },
      });
    });
  }, [inputs]);

  return (
    <Stack spacing={1.5}>
      <Card>
        <CardHeader title="Header" />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={open}
                    onChange={(_, checked) => {
                      useChannelInputs.setState((draft) => {
                        draft.open = checked;
                      });
                    }}
                  />
                }
                label="启用"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Input
                type="number"
                value={interval}
                onChange={(e) => {
                  useChannelInputs.setState((draft) => {
                    draft.interval = e.target.valueAsNumber;
                  });
                }}
                min={0}
                max={1024}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {inputs.map((channel, chIndex) => {
        return (
          <Card key={channel.channel}>
            <CardContent>
              <div
                data-channel={channel}
                ref={(el) => {
                  if (!el) {
                    return;
                  }

                  canvasRef.current ??= new Map();
                  const eles = canvasRef.current;
                  eles.set(channel.channel, el);

                  return () => {
                    eles.delete(channel.channel);
                  };
                }}
              ></div>
            </CardContent>
            <Divider />
            <CardContent>
              <Grid container spacing={1.5}>
                <Grid size={12}>
                  <Input
                    type="number"
                    value={channel.db}
                    onChange={(e) => {
                      useChannelInputs.setState((draft) => {
                        draft.inputs[chIndex].db = e.target.valueAsNumber;
                      });
                    }}
                  />
                </Grid>
                {channel.gates.map((gate, index) => {
                  return (
                    <Grid size={12} key={index}>
                      <Input
                        type="number"
                        value={gate.x}
                        onChange={(e) => {
                          useChannelInputs.setState((draft) => {
                            draft.inputs[chIndex].gates[index].x =
                              e.target.valueAsNumber;
                          });
                        }}
                      />
                      <Input
                        type="number"
                        value={gate.y}
                        onChange={(e) => {
                          useChannelInputs.setState((draft) => {
                            draft.inputs[chIndex].gates[index].y =
                              e.target.valueAsNumber;
                          });
                        }}
                      />
                      <Input
                        type="number"
                        value={gate.width}
                        onChange={(e) => {
                          useChannelInputs.setState((draft) => {
                            draft.inputs[chIndex].gates[index].width =
                              e.target.valueAsNumber;
                          });
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};
