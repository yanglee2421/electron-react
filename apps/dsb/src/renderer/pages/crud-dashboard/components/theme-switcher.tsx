import { DarkMode, LightMode } from "@mui/icons-material";
import {
  IconButton,
  Tooltip,
  useColorScheme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import "@mui/material/themeCssVarsAugmentation";
import React from "react";

export default function ThemeSwitcher() {
  const theme = useTheme();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredMode = prefersDarkMode ? "dark" : "light";

  const { mode, setMode } = useColorScheme();

  const paletteMode = !mode || mode === "system" ? preferredMode : mode;

  const toggleMode = React.useCallback(() => {
    setMode(paletteMode === "dark" ? "light" : "dark");
  }, [setMode, paletteMode]);

  return (
    <Tooltip
      title={`${paletteMode === "dark" ? "Light" : "Dark"} mode`}
      enterDelay={1000}
    >
      <div>
        <IconButton
          size="small"
          aria-label={`Switch to ${paletteMode === "dark" ? "light" : "dark"} mode`}
          onClick={toggleMode}
        >
          {theme.getColorSchemeSelector ? (
            <React.Fragment>
              <LightMode
                sx={{
                  display: "inline",
                  [theme.getColorSchemeSelector("dark")]: {
                    display: "none",
                  },
                }}
              />
              <DarkMode
                sx={{
                  display: "none",
                  [theme.getColorSchemeSelector("dark")]: {
                    display: "inline",
                  },
                }}
              />
            </React.Fragment>
          ) : null}
        </IconButton>
      </div>
    </Tooltip>
  );
}
