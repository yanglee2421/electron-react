import { useMobileMode } from "#renderer/api/fetch_preload";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import {
  DarkModeOutlined,
  DesktopWindowsOutlined,
  LightModeOutlined,
  PhonelinkOutlined,
  PushPin,
  PushPinOutlined,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DashboardLayout, PageContainer } from "@toolpad/core";
import { normalizePathname } from "@yotulee/run";
import React from "react";
import { Outlet, useLocation } from "react-router";

const createSegmentAlias = () => {
  const segmentAlias = new Map([
    ["hxzy", "华兴致远"],
    ["jtv", "京天威统型"],
    ["jtv_xuzhoubei", "徐州北"],
    ["jtv_guangzhoubei", "广州北"],
    ["jtv_guangzhoujibaoduan", "广州机保段"],
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

const calculateTitle = (
  pathname: string,
  segmentAlias: Map<string, string>,
) => {
  const segments = normalizePathname(pathname).split("/");

  const lastSegment = segments.at(-1);
  if (!lastSegment) return;

  const title = decodeURIComponent(lastSegment);

  return calculateAlias(segmentAlias, title);
};

const calculateBreadcrumbs = (
  pathname: string,
  segmentAlias: Map<string, string>,
): React.ComponentProps<typeof PageContainer>["breadcrumbs"] => {
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

interface ModeIconProps {
  mode: string;
}

const ModeIcon = ({ mode }: ModeIconProps) => {
  switch (mode) {
    case "light":
      return <LightModeOutlined />;
    case "dark":
      return <DarkModeOutlined />;
    case "system":
    default:
      return <DesktopWindowsOutlined />;
  }
};

const ModeToggle = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const mode = useProfileStore((state) => state.mode);

  const setMode = (newMode: "system" | "light" | "dark") => {
    document.startViewTransition(async () => {
      useProfileStore.setState((draft) => {
        draft.mode = newMode;
      });
    });
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <ModeIcon mode={mode} />
      </IconButton>
      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("light");
          }}
        >
          <ListItemIcon>
            <LightModeOutlined />
          </ListItemIcon>
          <ListItemText primary="明亮" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("dark");
          }}
        >
          <ListItemIcon>
            <DarkModeOutlined />
          </ListItemIcon>
          <ListItemText primary="黑暗" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("system");
          }}
        >
          <ListItemIcon>
            <DesktopWindowsOutlined />
          </ListItemIcon>
          <ListItemText primary="系统" />
        </MenuItem>
      </Menu>
    </>
  );
};

const MobileModeButton = () => {
  const theme = useTheme();
  const mobileMode = useMobileMode();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <IconButton
      onClick={() => {
        mobileMode.mutate(!isSmallScreen);
      }}
    >
      <PhonelinkOutlined color={isSmallScreen ? "primary" : void 0} />
    </IconButton>
  );
};

const AlwaysOnTop = () => {
  const alwaysOnTop = useProfileStore((state) => state.alwaysOnTop);

  return (
    <IconButton
      onClick={() => {
        useProfileStore.setState((draft) => {
          draft.alwaysOnTop = !draft.alwaysOnTop;
        });
      }}
    >
      {alwaysOnTop ? <PushPin /> : <PushPinOutlined />}
    </IconButton>
  );
};

const ToolbarAccount = () => {
  return (
    <>
      <MobileModeButton />
      <AlwaysOnTop />
      <ModeToggle />
    </>
  );
};

export const DashLayout = () => {
  const location = useLocation();

  const segmentAlias = createSegmentAlias();
  const title = calculateTitle(location.pathname, segmentAlias);
  const breadcrumbs = calculateBreadcrumbs(location.pathname, segmentAlias);

  return (
    <DashboardLayout
      slots={{
        toolbarAccount: ToolbarAccount,
      }}
    >
      <PageContainer title={title} breadcrumbs={breadcrumbs}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

export const BlankLayout = () => {
  return (
    <Box
      sx={{
        blockSize: "100dvh",
        inlineSize: "100dvw",
        position: "fixed",
        inset: 0,
      }}
    >
      <Outlet />
    </Box>
  );
};
