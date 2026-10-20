import { useChannelInputs } from "#renderer/hooks/stores/use-channel-inputs";
import { ipc } from "#renderer/lib/ipc";
import React from "react";
import type { Subscription } from "rxjs";
import { Observable } from "rxjs";
import { useShallow } from "zustand/shallow";
import type { MessageAction } from "./worker";
import workerPath from "./worker?worker&url";

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
    <div>
      <input
        type="checkbox"
        checked={open}
        onChange={(_) => {
          useChannelInputs.setState((draft) => {
            const checked = _.target.checked;
            draft.open = checked;
          });
        }}
      />
      <input
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
      {inputs.map((channel, chIndex) => {
        return (
          <div key={channel.channel}>
            <h2>{channel.channel}</h2>
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
            <div>
              <input
                type="number"
                value={channel.db}
                onChange={(e) => {
                  useChannelInputs.setState((draft) => {
                    draft.inputs[chIndex].db = e.target.valueAsNumber;
                  });
                }}
              />
              {channel.gates.map((gate, index) => {
                return (
                  <div>
                    <input
                      type="number"
                      value={gate.x}
                      onChange={(e) => {
                        useChannelInputs.setState((draft) => {
                          draft.inputs[chIndex].gates[index].x =
                            e.target.valueAsNumber;
                        });
                      }}
                    />
                    <input
                      type="number"
                      value={gate.y}
                      onChange={(e) => {
                        useChannelInputs.setState((draft) => {
                          draft.inputs[chIndex].gates[index].y =
                            e.target.valueAsNumber;
                        });
                      }}
                    />
                    <input
                      type="number"
                      value={gate.width}
                      onChange={(e) => {
                        useChannelInputs.setState((draft) => {
                          draft.inputs[chIndex].gates[index].width =
                            e.target.valueAsNumber;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
