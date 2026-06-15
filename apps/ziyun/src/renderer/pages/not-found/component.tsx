import { Home } from "@mui/icons-material";
import { Box, Button, Divider, Typography } from "@mui/material";
import { Link } from "react-router";

export const Component = () => {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",

        height: "100dvh",
      }}
    >
      <Box>
        <Typography variant="h1">404</Typography>
        <Typography variant="h2">页面未找到</Typography>
        <Typography>
          很抱歉，您访问的页面不存在。该资源可能已被移除，或者返回首页以继续。
        </Typography>
        <Typography variant="body2"></Typography>
        <Divider sx={{ marginBlock: 1.5 }}>请尝试</Divider>
        <Button
          variant="contained"
          to="/"
          component={Link}
          fullWidth
          size="large"
          startIcon={<Home />}
        >
          返回首页
        </Button>
      </Box>
    </Box>
  );
};
