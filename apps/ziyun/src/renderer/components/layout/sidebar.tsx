import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import {
  CalendarMonth,
  CalendarMonthRounded,
  CalendarToday,
  CalendarTodayRounded,
  Commit,
  ExpandMore,
  Info,
  KeyboardCommandKey,
  Memory,
  PrecisionManufacturing,
  QrCodeScannerRounded,
  Science,
  Settings,
  SsidChart,
  Today,
  TodayRounded,
  Train,
  TuneRounded,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  styled,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { normalizePathname } from "@yotulee/run";
import React from "react";
import { Link, useLocation } from "react-router";
import { animationFrameScheduler, auditTime, Observable } from "rxjs";
import "./sidebar.css";

const StyledLink = styled(Link)(({ theme }) => {
  return {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),

    textDecoration: "none",
  };
});

const useIntersection = () => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const intersection$ = new Observable<boolean>((sub) => {
      const observer = new IntersectionObserver(([entry]) => {
        sub.next(entry.isIntersecting);
      });
      observer.observe(el);

      return () => {
        observer.unobserve(el);
        observer.disconnect();
      };
    });

    const sub = intersection$
      .pipe(auditTime(0, animationFrameScheduler))
      .subscribe((value) => {
        setIsIntersecting(value);
      });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  return [isIntersecting, ref] as const;
};

interface SidebarProps {
  action?: React.ReactNode;
}

export const Sidebar = (props: SidebarProps) => {
  const theme = useTheme();
  const [isIntersecting, scrollRef] = useIntersection();
  const showHxzyHmisMenu = React.useDeferredValue(
    useProfileStore((s) => s.showHxzyHmisMenu),
  );
  const showJtvHmisMenu = React.useDeferredValue(
    useProfileStore((s) => s.showJtvHmisMenu),
  );
  const showGuangzhoubeiHmisMenu = React.useDeferredValue(
    useProfileStore((s) => s.showGuangzhoubeiHmisMenu),
  );
  const showGuangzhoujibaoduanHmisMenu = React.useDeferredValue(
    useProfileStore((s) => s.showGuangzhoujibaoduanHmisMenu),
  );
  const showGuangzhoucheliangMenu = React.useDeferredValue(
    useProfileStore((s) => s.showGuangzhoucheliangMenu),
  );
  const showKhHmisMenu = React.useDeferredValue(
    useProfileStore((s) => s.showKhHmisMenu),
  );
  const showFuzhoudong = React.useDeferredValue(
    useProfileStore((s) => s.showFuzhoudong),
  );
  const showPLCMenu = React.useDeferredValue(
    useProfileStore((s) => s.showPLCMenu),
  );
  const showQT = React.useDeferredValue(useProfileStore((s) => s.showQT));
  const showHmis =
    showHxzyHmisMenu ||
    showJtvHmisMenu ||
    showGuangzhoubeiHmisMenu ||
    showGuangzhoujibaoduanHmisMenu ||
    showGuangzhoucheliangMenu ||
    showKhHmisMenu ||
    showFuzhoudong;

  return (
    <>
      <Toolbar
        sx={{
          boxShadow: !isIntersecting ? theme.shadows[1] : theme.shadows[0],
          transition: theme.transitions.create("box-shadow"),
        }}
      >
        <StyledLink to={{ pathname: "/" }}>
          <KeyboardCommandKey color="primary" />
          <Typography variant="h6" color="primary">
            武铁紫云接口面板
          </Typography>
        </StyledLink>
        <Box sx={{ mx: "auto" }} />
        {props.action}
      </Toolbar>
      <Divider />
      <Box
        component={"nav"}
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          overflow: "auto",
        }}
        className="scroll-container"
      >
        <div ref={scrollRef}></div>
        <React.Activity mode={showHmis ? "visible" : "hidden"}>
          <NavGroup title="HMIS">
            <React.Activity mode={showHxzyHmisMenu ? "visible" : "hidden"}>
              <NavCollapse label="成都北车辆段">
                <NavButton
                  path="/hxzy"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/hxzy/verifies"
                  label="日常校验"
                  icon={<CalendarTodayRounded />}
                />
                <NavButton
                  path="/hxzy/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity mode={showJtvHmisMenu ? "visible" : "hidden"}>
              <NavCollapse label="京天威统型">
                <NavButton
                  path="/jtv"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/jtv/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity
              mode={showGuangzhoubeiHmisMenu ? "visible" : "hidden"}
            >
              <NavCollapse label="广州北车辆段">
                <NavButton
                  path="/jtv_guangzhoubei"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/jtv_guangzhoubei/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity
              mode={showGuangzhoujibaoduanHmisMenu ? "visible" : "hidden"}
            >
              <NavCollapse label={"广州机保段"}>
                <NavButton
                  path="/jtv_guangzhoujibaoduan"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/jtv_guangzhoujibaoduan/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity
              mode={showGuangzhoucheliangMenu ? "visible" : "hidden"}
            >
              <NavCollapse label={"广州车辆厂"}>
                <NavButton
                  path="/guangzhoucheliang"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/guangzhoucheliang/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity mode={showKhHmisMenu ? "visible" : "hidden"}>
              <NavCollapse label={"安康车辆段"}>
                <NavButton
                  path="/kh"
                  label="HMIS"
                  icon={<QrCodeScannerRounded />}
                />
                <NavButton
                  path="/kh/detections"
                  label="现车作业"
                  icon={<Train />}
                />
                <NavButton
                  path="/kh/verify"
                  label="日常校验"
                  icon={<CalendarTodayRounded />}
                />
                <NavButton
                  path="/kh/quartor"
                  label="季度校验"
                  icon={<CalendarMonthRounded />}
                />
                <NavButton
                  path="/kh/annual"
                  label="年度校验"
                  icon={<CalendarTodayRounded />}
                />
                <NavButton
                  path="/kh/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
            <React.Activity mode={showFuzhoudong ? "visible" : "hidden"}>
              <NavCollapse label={"福州车辆段"}>
                <NavButton
                  path="/fuzhoudong/verify"
                  label="日常校验"
                  icon={<CalendarTodayRounded />}
                />
                <NavButton
                  path="/fuzhoudong/quartor"
                  label="季度校验"
                  icon={<CalendarMonthRounded />}
                />
                <NavButton
                  path="/fuzhoudong/annual"
                  label="年度校验"
                  icon={<CalendarTodayRounded />}
                />
                <NavButton
                  path="/fuzhoudong/setting"
                  label="设置"
                  icon={<TuneRounded />}
                />
              </NavCollapse>
            </React.Activity>
          </NavGroup>
        </React.Activity>

        {/* QT */}
        <React.Activity mode={showQT ? "visible" : "hidden"}>
          <NavGroup title="信创版软件相关">
            <NavButton path="/qt" label="信创版软件" icon={<Commit />} />
            <NavButton
              path="/qt/detections"
              label="现车作业"
              icon={<Train />}
            />
            <NavButton path="/qt/verifies" label="日常校验" icon={<Today />} />
            <NavButton
              path="/qt/quartors"
              label="季度校验"
              icon={<CalendarMonth />}
            />
            <NavButton
              path="/qt/anniversary"
              label="年度校验"
              icon={<CalendarToday />}
            />
            <NavButton
              path="/qt/dynamic"
              label="动态信噪比"
              icon={<SsidChart />}
            />
          </NavGroup>
        </React.Activity>

        {/* Common */}
        <NavGroup title="常规12通道软件">
          <NavButton path="/detection" label="现车作业" icon={<Train />} />
          <NavButton path="/verify" label="日常校验" icon={<TodayRounded />} />
          <NavButton
            path="/quartors"
            label="季度校验"
            icon={<CalendarMonthRounded />}
          />
          <NavButton
            path="/anniversary"
            label="年度校验"
            icon={<CalendarTodayRounded />}
          />
        </NavGroup>

        {/* Else */}
        <NavGroup title="其它">
          <NavButton path="/log" label="日志" icon={<Info />} />
          <NavButton path="/settings" label="设置" icon={<Settings />} />
          <React.Activity mode={showPLCMenu ? "visible" : "hidden"}>
            <NavButton label="PLC" icon={<Memory />} path="/plc" />
          </React.Activity>
          {import.meta.env.DEV && (
            <NavButton label="实验室" icon={<Science />} path="/lab" />
          )}
        </NavGroup>
      </Box>

      {/* <Divider />
      <Toolbar></Toolbar> */}
    </>
  );
};

interface NavButtonProps {
  path: string;
  label: React.ReactNode;
  icon: React.ReactNode;
}

const NavButton = (props: NavButtonProps) => {
  const { icon, path, label } = props;
  const location = useLocation();

  return (
    <React.ViewTransition>
      <ListItemButton
        component={Link}
        to={{ pathname: path }}
        selected={Object.is(normalizePathname(location.pathname), path)}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </React.ViewTransition>
  );
};

interface NavGroupProps {
  children: React.ReactNode;
  title: React.ReactNode;
}

const NavGroup = (props: NavGroupProps) => {
  return (
    <React.ViewTransition>
      <List
        subheader={
          <ListSubheader disableSticky sx={{ backgroundColor: "transparent" }}>
            {props.title}
          </ListSubheader>
        }
      >
        {props.children}
      </List>
    </React.ViewTransition>
  );
};

interface NavCollapseProps {
  children: React.ReactNode;
  label: React.ReactNode;
}

const NavCollapse = (props: NavCollapseProps) => {
  const [show, setShow] = React.useState(true);

  const theme = useTheme();

  return (
    <React.ViewTransition>
      <ListItemButton
        onClick={() => {
          setShow((p) => !p);
        }}
      >
        <ListItemIcon>
          <PrecisionManufacturing />
        </ListItemIcon>
        <ListItemText primary={props.label} />
        <ExpandMore
          sx={{
            rotate: show ? 0 : "-90deg",
            transition: theme.transitions.create("rotate"),
          }}
        />
      </ListItemButton>
      <Collapse in={show} unmountOnExit>
        <List
          disablePadding
          sx={{
            "& .MuiListItemButton-root": { paddingInlineStart: 4 },
          }}
        >
          {props.children}
        </List>
      </Collapse>
    </React.ViewTransition>
  );
};
