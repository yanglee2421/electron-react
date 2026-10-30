import { useAppProfile } from "#renderer/hooks/stores/use-app-profile";
import { ipc } from "#renderer/lib/ipc";
import React from "react";

export const Component = () => {
  const [enabled, setEnabled] = React.useState(false);

  const ref = React.useRef<HTMLCanvasElement>(null);

  const enableCmd = useAppProfile((s) => s.enableCmd);

  React.useEffect(() => {
    ipc.invoke("cmd/click-start", enabled);
  }, [enabled]);

  React.useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const ctx = el.getContext("2d");

    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    return () => {};
  }, []);

  return (
    <div className="space-y-3">
      <div className="border p-1">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={enableCmd}
            onChange={(e) => {
              useAppProfile.setState((draft) => {
                draft.enableCmd = e.target.checked;
              });
            }}
          />
          enable cmd
        </label>
      </div>
      <div className="border p-1">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
            }}
          />
          enabled auto script
        </label>
      </div>
      <div>
        <canvas ref={ref} className="border" width={256} height={256}></canvas>
      </div>
    </div>
  );
};
