import { alpha, styled, Typography } from "@mui/material";
import {
  CalendarMonthOutlined,
  CalendarTodayOutlined,
  SettingsOutlined,
  TrainOutlined,
  ChevronRightOutlined,
  QrCodeScannerOutlined,
  InfoOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { NavLink } from "react-router";

const LinkWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),

  "& a": {
    textDecoration: "none",
    color: theme.palette.text.primary,

    display: "flex",
    gap: theme.spacing(3),
    alignItem: "center",

    padding: theme.spacing(5),

    [theme.breakpoints.up("sm")]: {
      paddingInline: theme.spacing(3),
      paddingBlock: theme.spacing(3),
    },
  },
  "& a:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "& a[aria-current=page]": {
    color: theme.palette.primary.main,
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.action.activatedOpacity
    ),
  },
}));

const list = [
  { to: "/hxzy_hmis", label: "华兴致远HMIS", icon: <QrCodeScannerOutlined /> },

  {
    to: "/hxzy_verifies",
    label: "华兴致远日常校验",
    icon: <CalendarTodayOutlined />,
  },
  {
    to: "/hxzy_hmis_setting",
    label: "华兴致远HMIS设置",
    icon: <TuneOutlined />,
  },
  { to: "/jtv_hmis", label: "京天威HMIS", icon: <QrCodeScannerOutlined /> },
  {
    to: "/jtv_hmis_setting",
    label: "京天威HMIS设置",
    icon: <TuneOutlined />,
  },
  {
    to: "/jtv_hmis_xuzhoubei",
    label: "京天威HMIS(徐州北)",
    icon: <QrCodeScannerOutlined />,
  },
  {
    to: "/jtv_hmis_xuzhoubei_setting",
    label: "京天威HMIS设置(徐州北)",
    icon: <TuneOutlined />,
  },
  {
    to: "/kh_hmis",
    label: "康华HMIS",
    icon: <QrCodeScannerOutlined />,
  },
  {
    to: "/kh_hmis_setting",
    label: "康华HMIS设置",
    icon: <TuneOutlined />,
  },
  {
    to: "/detection",
    label: "现车作业",
    icon: <TrainOutlined />,
  },
  { to: "/quartors", label: "季度校验", icon: <CalendarMonthOutlined /> },
  { to: "/log", label: "日志", icon: <InfoOutlined /> },
  {
    to: "/settings",
    label: "设置",
    icon: <SettingsOutlined />,
  },
];

export const NavMenu = () => {
  return (
    <LinkWrapper>
      {list.map((i) => (
        <NavLink key={i.to} to={i.to} end>
          {i.icon}
          <Typography variant="body1" component="span">
            {i.label}
          </Typography>
          <ChevronRightOutlined sx={{ marginInlineStart: "auto" }} />
        </NavLink>
      ))}
    </LinkWrapper>
  );
};

NavMenu.list = list;
