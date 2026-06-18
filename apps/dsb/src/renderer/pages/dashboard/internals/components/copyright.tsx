import { Link, Typography } from "@mui/material";

export default function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      align="center"
      {...props}
      sx={[
        {
          color: "text.secondary",
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        Sitemark
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
