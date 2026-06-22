import ColorModeIconDropdown from "#renderer/components/theme/color-mode-icon-dropdown";
import { NotificationsRounded } from "@mui/icons-material";
import { Box, Divider, Stack } from "@mui/material";
import CustomDatePicker from "./custom-date-picker";
import MenuButton from "./menu-button";
import NavbarBreadcrumbs from "./navbar-breadcrumbs";
import Search from "./search";

export default function Header() {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (t) => t.zIndex.appBar,

        backgroundColor: "inherit",
      }}
    >
      <Stack
        direction="row"
        sx={{
          display: { xs: "none", md: "flex" },
          width: "100%",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          maxWidth: { sm: "100%", md: "1700px" },
          px: 2,
          py: 1.5,
        }}
        spacing={2}
      >
        <NavbarBreadcrumbs />
        <Stack direction="row" sx={{ gap: 1 }}>
          <Search />
          <CustomDatePicker />
          <MenuButton showBadge aria-label="Open notifications">
            <NotificationsRounded />
          </MenuButton>
          <ColorModeIconDropdown />
        </Stack>
      </Stack>
      <Divider />
    </Box>
  );
}
