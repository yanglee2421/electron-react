import { Link } from "react-router";
import { Button, Typography } from "@mui/material";

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
