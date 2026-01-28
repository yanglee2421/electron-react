import { Button, Typography } from "@mui/material";
import { Link } from "react-router";
import { usePLCTest } from "#renderer/api/fetch_preload";
import { useNotifications } from "@toolpad/core";

export const Component = () => {
  const plcTest = usePLCTest();
  const notifications = useNotifications();

  return (
    <>
      <Typography>404</Typography>
      <Link to="/">
        <Button variant="contained">返回首页</Button>
      </Link>
      <Button
        onClick={() => {
          plcTest.mutate(void 0, {
            onError: (error) => {
              notifications.show(error.message, { severity: "error" });
            },
          });
        }}
      >
        Click me
      </Button>
    </>
  );
};
