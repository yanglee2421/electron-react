import { Button, Typography } from "@mui/material";
import { Link } from "react-router";

export const Component = () => {
  return (
    <>
      <Typography>404</Typography>
      <Link to="/">
        <Button variant="contained">返回首页</Button>
      </Link>
    </>
  );
};
