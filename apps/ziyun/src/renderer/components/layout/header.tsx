import {
  Box,
  Breadcrumbs,
  Link,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { normalizePathname } from "@yotulee/run";
import type React from "react";
import { Link as RouterLink, useLocation } from "react-router";
import { AlwaysOnTop } from "../always-on-top";
import { MobileModeButton } from "../mobile";
import { ModeToggle } from "../theme";

const createSegmentAlias = () => {
  const segmentAlias = new Map([
    ["hxzy", "华兴致远"],
    ["jtv", "京天威统型"],
    ["jtv_xuzhoubei", "徐州北"],
    ["jtv_guangzhoubei", "广州北"],
    ["jtv_guangzhoujibaoduan", "广州机保段"],
    ["guangzhoucheliang", "广州车辆厂"],
    ["kh", "康华"],
    ["verifies", "日常校验"],
    ["verify", "日常校验"],
    ["quartor", "季度校验"],
    ["annual", "年度校验"],
    ["setting", "设置"],
    ["detection", "现车作业"],
    ["verify", "日常校验"],
    ["quartors", "季度校验"],
    ["settings", "设置"],
    ["setting", "设置"],
    ["log", "日志"],
    ["md5_backup_image", "图片备份"],
    ["lab", "实验室"],
    ["help", "帮助"],
    ["chr53a", "探伤记录表"],
    ["anniversary", "年度校验"],
    ["chr503", "年度性能校验表"],
    ["chr501", "日常性能校验表"],
    ["chr501", "日常性能校验表"],
    ["plc", "PLC助手"],
  ]);

  return segmentAlias;
};

const calculateAlias = (segmentAlias: Map<string, string>, title: string) => {
  return segmentAlias.get(title) || title;
};

const calculateBreadcrumbs = (
  pathname: string,
  segmentAlias: Map<string, string>,
) => {
  const segments = normalizePathname(pathname).split("/");

  const breadcrumbs = segments.slice(1).map((segment, index, array) => {
    const title = decodeURIComponent(segment);

    return {
      title: calculateAlias(segmentAlias, title),
      path: Object.is(index + 1, array.length)
        ? void 0
        : normalizePathname(array.slice(0, index + 1).join("/")),
    };
  });
  return breadcrumbs;
};

export const Header = (props: React.PropsWithChildren) => {
  const theme = useTheme();
  const location = useLocation();
  const segmentAlias = createSegmentAlias();
  const breadcrumbs = calculateBreadcrumbs(location.pathname, segmentAlias);

  return (
    <Toolbar
      component={"header"}
      sx={{
        position: "sticky",
        insetBlockStart: 0,
        zIndex: theme.zIndex.appBar,

        gap: 1,

        backgroundColor: theme.palette.background.default,
      }}
    >
      {props.children}
      <Breadcrumbs sx={{ display: { xs: "none", sm: "flex" } }}>
        {breadcrumbs.map((item) => {
          if (item.path) {
            return (
              <Link
                underline="hover"
                color="inherit"
                component={RouterLink}
                to={item.path}
                key={item.path}
              >
                {item.title}
              </Link>
            );
          }

          return <Typography color="textPrimary">{item.title}</Typography>;
        })}
      </Breadcrumbs>
      <Box sx={{ mx: "auto" }} />
      <MobileModeButton />
      <AlwaysOnTop />
      <ModeToggle />
    </Toolbar>
  );
};
