import {
  CalendarMonthOutlined,
  CalendarTodayOutlined,
  SettingsOutlined,
  TrainOutlined,
  QrCodeScannerOutlined,
  InfoOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import type { Navigation } from "@toolpad/core";

const list: Navigation = [
  {
    kind: "header",
    title: "HMIS",
  },
  {
    title: "华兴致远",
    segment: "hxzy",
    children: [
      {
        segment: "/",
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "verifies",
        title: "日常校验",
        icon: <CalendarTodayOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "京天威",
    segment: "jtv",
    children: [
      {
        segment: "/",
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "京天威(徐州北)",
    segment: "jtv_xuzhoubei",
    children: [
      {
        segment: "/",
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "康华",
    segment: "kh",
    children: [
      {
        segment: "/",
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "常规",
  },
  {
    segment: "detection",
    title: "现车作业",
    icon: <TrainOutlined />,
  },
  {
    segment: "verify",
    title: "日常校验",
    icon: <CalendarTodayOutlined />,
  },
  {
    segment: "quartors",
    title: "季度校验",
    icon: <CalendarMonthOutlined />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "其它",
  },
  {
    segment: "log",
    title: "日志",
    icon: <InfoOutlined />,
  },
  {
    segment: "settings",
    title: "设置",
    icon: <SettingsOutlined />,
  },
];

export const NavMenu = () => {
  return null;
};

NavMenu.list = list;
