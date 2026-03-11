import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
} from "@mui/material";
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
      <Card
        sx={{
          minWidth: (t) => t.breakpoints.values.sm,
        }}
      >
        <CardHeader title="404" subheader="页面未找到" />
        <CardContent>
          很抱歉，您访问的页面不存在。请检查您输入的网址是否正确，或者返回首页以继续。
        </CardContent>
        <CardActions>
          <Button variant="contained" to="/" component={Link} fullWidth>
            返回首页
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};
