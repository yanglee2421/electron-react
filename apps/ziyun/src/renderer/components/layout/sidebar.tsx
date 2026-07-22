import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import {
  CalendarMonthRounded,
  CalendarTodayRounded,
  ExpandMore,
  Info,
  KeyboardCommandKey,
  MemoryRounded,
  PrecisionManufacturing,
  QrCodeScannerRounded,
  Science,
  Settings,
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

const StyledLink = styled(Link)(({ theme }) => {
  return {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),

    textDecoration: "none",
  };
});

interface SidebarProps {
  action?: React.ReactNode;
}

export const Sidebar = (props: SidebarProps) => {
  const [hxzyOpen, setHxzyOpen] = React.useState(true);
  const [jtvOpen, setJtvOpen] = React.useState(true);
  const [guangzhoubeiOpen, setGuangzhoubeiOpen] = React.useState(true);
  const [guangzhoujibaoduanOpen, setGuangzhoujibaoduanOpen] =
    React.useState(true);
  const [khOpen, setKhOpen] = React.useState(true);

  const theme = useTheme();
  const location = useLocation();
  const showHxzyHmisMenu = useProfileStore((s) => s.showHxzyHmisMenu);
  const showJtvHmisMenu = useProfileStore((s) => s.showJtvHmisMenu);
  const showGuangzhoubeiHmisMenu = useProfileStore(
    (s) => s.showGuangzhoubeiHmisMenu,
  );
  const showGuangzhoujibaoduanHmisMenu = useProfileStore(
    (s) => s.showGuangzhoujibaoduanHmisMenu,
  );
  const showKhHmisMenu = useProfileStore((s) => s.showKhHmisMenu);
  const showPLCMenu = useProfileStore((s) => s.showPLCMenu);
  const showHmis =
    showHxzyHmisMenu ||
    showJtvHmisMenu ||
    showGuangzhoubeiHmisMenu ||
    showGuangzhoujibaoduanHmisMenu ||
    showKhHmisMenu;

  return (
    <>
      <Toolbar>
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
      >
        {showHmis && (
          <List
            subheader={
              <ListSubheader
                disableSticky
                sx={{ backgroundColor: "transparent" }}
              >
                HMIS
              </ListSubheader>
            }
          >
            {showHxzyHmisMenu && (
              <>
                <ListItemButton
                  onClick={() => {
                    setHxzyOpen((p) => !p);
                  }}
                >
                  <ListItemIcon>
                    <PrecisionManufacturing />
                  </ListItemIcon>
                  <ListItemText primary={"成都北车辆段"} />
                  <ExpandMore
                    sx={{
                      rotate: hxzyOpen ? 0 : "-90deg",
                      transition: theme.transitions.create("rotate"),
                    }}
                  />
                </ListItemButton>
                <Collapse in={hxzyOpen} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/hxzy" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/hxzy",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <QrCodeScannerRounded />
                      </ListItemIcon>
                      <ListItemText primary={"HMIS"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/hxzy/verifies" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/hxzy/verifies",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <CalendarTodayRounded />
                      </ListItemIcon>
                      <ListItemText primary={"日常校验"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/hxzy/setting" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/hxzy/setting",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <TuneRounded />
                      </ListItemIcon>
                      <ListItemText primary={"设置"} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
            {showJtvHmisMenu && (
              <>
                <ListItemButton
                  onClick={() => {
                    setJtvOpen((p) => !p);
                  }}
                >
                  <ListItemIcon>
                    <PrecisionManufacturing />
                  </ListItemIcon>
                  <ListItemText primary={"京天威统型"} />
                  <ExpandMore
                    sx={{
                      rotate: jtvOpen ? 0 : "-90deg",
                      transition: theme.transitions.create("rotate"),
                    }}
                  />
                </ListItemButton>
                <Collapse in={jtvOpen} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <QrCodeScannerRounded />
                      </ListItemIcon>
                      <ListItemText primary={"HMIS"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv/setting" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv/setting",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <TuneRounded />
                      </ListItemIcon>
                      <ListItemText primary={"设置"} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
            {showGuangzhoubeiHmisMenu && (
              <>
                <ListItemButton
                  onClick={() => {
                    setGuangzhoubeiOpen((p) => !p);
                  }}
                >
                  <ListItemIcon>
                    <PrecisionManufacturing />
                  </ListItemIcon>
                  <ListItemText primary={"广州北车辆段"} />
                  <ExpandMore
                    sx={{
                      rotate: guangzhoubeiOpen ? 0 : "-90deg",
                      transition: theme.transitions.create("rotate"),
                    }}
                  />
                </ListItemButton>
                <Collapse in={guangzhoubeiOpen} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv_guangzhoubei" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv_guangzhoubei",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <QrCodeScannerRounded />
                      </ListItemIcon>
                      <ListItemText primary={"HMIS"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv_guangzhoubei/setting" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv_guangzhoubei/setting",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <TuneRounded />
                      </ListItemIcon>
                      <ListItemText primary={"设置"} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
            {showGuangzhoujibaoduanHmisMenu && (
              <>
                <ListItemButton
                  onClick={() => {
                    setGuangzhoujibaoduanOpen((p) => !p);
                  }}
                >
                  <ListItemIcon>
                    <PrecisionManufacturing />
                  </ListItemIcon>
                  <ListItemText primary={"广州机保段"} />
                  <ExpandMore
                    sx={{
                      rotate: guangzhoujibaoduanOpen ? 0 : "-90deg",
                      transition: theme.transitions.create("rotate"),
                    }}
                  />
                </ListItemButton>
                <Collapse in={guangzhoujibaoduanOpen} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv_guangzhoujibaoduan" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv_guangzhoujibaoduan",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <QrCodeScannerRounded />
                      </ListItemIcon>
                      <ListItemText primary={"HMIS"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/jtv_guangzhoujibaoduan/setting" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/jtv_guangzhoujibaoduan/setting",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <TuneRounded />
                      </ListItemIcon>
                      <ListItemText primary={"设置"} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
            {showKhHmisMenu && (
              <>
                <ListItemButton
                  onClick={() => {
                    setKhOpen((p) => !p);
                  }}
                >
                  <ListItemIcon>
                    <PrecisionManufacturing />
                  </ListItemIcon>
                  <ListItemText primary={"安康车辆段"} />
                  <ExpandMore
                    sx={{
                      rotate: khOpen ? 0 : "-90deg",
                      transition: theme.transitions.create("rotate"),
                    }}
                  />
                </ListItemButton>
                <Collapse in={khOpen} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <QrCodeScannerRounded />
                      </ListItemIcon>
                      <ListItemText primary={"HMIS"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh/detections" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh/detections",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <Train />
                      </ListItemIcon>
                      <ListItemText primary={"现车作业"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh/verify" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh/verify",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <CalendarTodayRounded />
                      </ListItemIcon>
                      <ListItemText primary={"日常校验"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh/quartor" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh/quartor",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <CalendarMonthRounded />
                      </ListItemIcon>
                      <ListItemText primary={"季度校验"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh/annual" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh/annual",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <CalendarTodayRounded />
                      </ListItemIcon>
                      <ListItemText primary={"年度校验"} />
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      to={{ pathname: "/kh/setting" }}
                      selected={Object.is(
                        normalizePathname(location.pathname),
                        "/kh/setting",
                      )}
                      sx={{ paddingInlineStart: 4 }}
                    >
                      <ListItemIcon>
                        <TuneRounded />
                      </ListItemIcon>
                      <ListItemText primary={"设置"} />
                    </ListItemButton>
                  </List>
                </Collapse>
              </>
            )}
          </List>
        )}
        <List
          subheader={
            <ListSubheader
              disableSticky
              sx={{ backgroundColor: "transparent" }}
            >
              常规12通道软件
            </ListSubheader>
          }
        >
          <ListItemButton
            component={Link}
            to={{ pathname: "/detection" }}
            selected={Object.is(
              normalizePathname(location.pathname),
              "/detection",
            )}
          >
            <ListItemIcon>
              <Train />
            </ListItemIcon>
            <ListItemText primary={"现车作业"} />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={{ pathname: "/verify" }}
            selected={Object.is(
              normalizePathname(location.pathname),
              "/verify",
            )}
          >
            <ListItemIcon>
              <TodayRounded />
            </ListItemIcon>
            <ListItemText primary={"日常校验"} />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={{ pathname: "/quartors" }}
            selected={Object.is(
              normalizePathname(location.pathname),
              "/quartors",
            )}
          >
            <ListItemIcon>
              <CalendarMonthRounded />
            </ListItemIcon>
            <ListItemText primary={"季度校验"} />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={{ pathname: "/anniversary" }}
            selected={Object.is(
              normalizePathname(location.pathname),
              "/anniversary",
            )}
          >
            <ListItemIcon>
              <CalendarTodayRounded />
            </ListItemIcon>
            <ListItemText primary={"年度校验"} />
          </ListItemButton>
        </List>
        <List
          subheader={
            <ListSubheader
              disableSticky
              sx={{ backgroundColor: "transparent" }}
            >
              其它
            </ListSubheader>
          }
        >
          <ListItemButton
            component={Link}
            to={{ pathname: "/log" }}
            selected={Object.is(normalizePathname(location.pathname), "/log")}
          >
            <ListItemIcon>
              <Info />
            </ListItemIcon>
            <ListItemText primary={"日志"} />
          </ListItemButton>
          <ListItemButton
            component={Link}
            to={{ pathname: "/settings" }}
            selected={Object.is(
              normalizePathname(location.pathname),
              "/settings",
            )}
          >
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary={"设置"} />
          </ListItemButton>
          {showPLCMenu && (
            <ListItemButton
              component={Link}
              to={{ pathname: "/plc" }}
              selected={Object.is(normalizePathname(location.pathname), "/plc")}
            >
              <ListItemIcon>
                <MemoryRounded />
              </ListItemIcon>
              <ListItemText primary={"PLC"} />
            </ListItemButton>
          )}
          {import.meta.env.DEV && (
            <ListItemButton
              component={Link}
              to={{ pathname: "/lab" }}
              selected={Object.is(normalizePathname(location.pathname), "/plc")}
            >
              <ListItemIcon>
                <Science />
              </ListItemIcon>
              <ListItemText primary={"实验室"} />
            </ListItemButton>
          )}
        </List>
      </Box>
      {/* <Divider />
      <Toolbar></Toolbar> */}
    </>
  );
};
