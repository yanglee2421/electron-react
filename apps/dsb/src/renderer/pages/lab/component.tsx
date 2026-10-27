import { useAppProfile } from "#renderer/hooks/stores/use-app-profile";
import { ipc } from "#renderer/lib/ipc";

export const Component = () => {
  const enableCmd = useAppProfile((s) => s.enableCmd);

  return (
    <>
      <label>
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
      <button
        onClick={() => {
          ipc.invoke("cmd/click-start");
        }}
      >
        click me
      </button>
    </>
  );
};
