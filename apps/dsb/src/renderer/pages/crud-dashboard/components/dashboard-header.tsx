import { Menu, MenuOpen } from "@mui/icons-material";
import {
  Box,
  IconButton,
  AppBar as MuiAppBar,
  Stack,
  styled,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { Link } from "react-router";
import ThemeSwitcher from "./theme-switcher";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: "solid",
  borderColor: (theme.vars ?? theme).palette.divider,
  boxShadow: "none",
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled("div")({
  position: "relative",
  height: 40,
  display: "flex",
  alignItems: "center",
  "& img": {
    maxHeight: 40,
  },
});

export interface DashboardHeaderProps {
  logo?: React.ReactNode;
  title?: string;
  menuOpen: boolean;
  onToggleMenu: (open: boolean) => void;
}

export default function DashboardHeader({
  logo,
  title,
  menuOpen,
  onToggleMenu,
}: DashboardHeaderProps) {
  const theme = useTheme();

  const handleMenuOpen = React.useCallback(() => {
    onToggleMenu(!menuOpen);
  }, [menuOpen, onToggleMenu]);

  const getMenuIcon = React.useCallback(
    (isExpanded: boolean) => {
      const expandMenuActionText = "Expand";
      const collapseMenuActionText = "Collapse";

      return (
        <Tooltip
          title={`${isExpanded ? collapseMenuActionText : expandMenuActionText} menu`}
          enterDelay={1000}
        >
          <div>
            <IconButton
              size="small"
              aria-label={`${isExpanded ? collapseMenuActionText : expandMenuActionText} navigation menu`}
              onClick={handleMenuOpen}
            >
              {isExpanded ? <MenuOpen /> : <Menu />}
            </IconButton>
          </div>
        </Tooltip>
      );
    },
    [handleMenuOpen],
  );

  return (
    <AppBar color="inherit" position="absolute" sx={{ displayPrint: "none" }}>
      <Toolbar sx={{ backgroundColor: "inherit", mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <Box sx={{ mr: 1 }}>{getMenuIcon(menuOpen)}</Box>
            <Link to="/" style={{ textDecoration: "none" }}>
              <Stack direction="row" sx={{ alignItems: "center" }}>
                {logo ? <LogoContainer>{logo}</LogoContainer> : null}
                {title ? (
                  <Typography
                    variant="h6"
                    sx={{
                      color: (theme.vars ?? theme).palette.primary.main,
                      fontWeight: "700",
                      ml: 1,
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {title}
                  </Typography>
                ) : null}
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", marginLeft: "auto" }}
          >
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <ThemeSwitcher />
            </Stack>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
