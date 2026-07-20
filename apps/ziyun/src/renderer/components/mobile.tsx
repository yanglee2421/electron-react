import { useMobileMode } from "#renderer/api/fetch_preload";
import { PhonelinkOutlined } from "@mui/icons-material";
import { IconButton, useMediaQuery, useTheme } from "@mui/material";

export const MobileModeButton = () => {
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