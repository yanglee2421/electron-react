import {
  alpha,
  AppBar,
  Box,
  Container,
  IconButton,
  Stack,
  styled,
  Toolbar,
  useTheme,
} from "@mui/material";
import { CloseOutlined, MenuOutlined } from "@mui/icons-material";
import { Link as RouterLink } from "react-router";
import React from "react";

const HEADER_SIZE_XS = 14;
const HEADER_SIZE_SM = 16;
const ASIDE_SIZE = 72;

const AuthAsideWrapper = styled("div")(({ theme }) => ({
  position: "fixed",
  zIndex: theme.zIndex.appBar - 1,
  insetInlineStart: 0,
  insetBlockStart: 0,

  inlineSize: "100dvw",
  blockSize: "100dvh",

  paddingBlockStart: theme.spacing(HEADER_SIZE_XS),
  [theme.breakpoints.up("sm")]: {
    maxInlineSize: theme.spacing(ASIDE_SIZE),

    paddingBlockStart: theme.spacing(HEADER_SIZE_SM),
  },

  overflow: "hidden",

  backgroundColor: theme.palette.background.default,
}));

const AuthAside = styled("aside")(({ theme }) => ({
  blockSize: "100%",

  overflowX: "visible",
  overflowY: "auto",
  borderInlineEnd: `1px solid ${theme.palette.divider}`,
}));

const AuthContainer = styled("div")(({ theme }) => ({
  flexDirection: "column",

  minBlockSize: "100dvh",

  paddingBlockStart: theme.spacing(HEADER_SIZE_XS),
  [theme.breakpoints.up("sm")]: {
    display: "flex",

    paddingInlineStart: theme.spacing(ASIDE_SIZE),
    paddingBlockStart: theme.spacing(HEADER_SIZE_SM),
  },
}));

const AuthMainWrapper = styled("div")(({ theme }) => ({
  flexGrow: 1,

  paddingBlock: theme.spacing(2),

  [theme.breakpoints.up("sm")]: {
    paddingBlock: theme.spacing(3),
  },
}));

const AuthFooterWrapper = styled("div")(({ theme }) => ({
  paddingBlock: theme.spacing(1.75),

  [theme.breakpoints.up("sm")]: {
    paddingInline: theme.spacing(3),
    paddingBlock: theme.spacing(3.75),
  },
}));

type AuthLayoutProps = React.PropsWithChildren<{
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  logo?: React.ReactNode;
  header?: React.ReactNode;
  showMenuInMobile?: boolean;
  onShowMenuInMobileChange?(): void;
}>;

export const AuthLayout = (props: AuthLayoutProps) => {
  return (
    <>
      <AppBar
        elevation={0}
        sx={(theme) => ({
          bgcolor: "transparent",
          borderBlockEnd: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.default, 0.6),
          backdropFilter: "blur(8px)",
        })}
      >
        <Toolbar>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 2.5,
              alignItems: "flex-end",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {props.logo}
          </Box>

          <IconButton
            onClick={props.onShowMenuInMobileChange}
            sx={{ display: { sm: "none" } }}
          >
            {props.showMenuInMobile ? <CloseOutlined /> : <MenuOutlined />}
          </IconButton>

          {props.header}
        </Toolbar>
      </AppBar>
      <AuthAsideWrapper
        sx={{
          maxInlineSize: props.showMenuInMobile ? "none" : 0,
        }}
      >
        <AuthAside>{props.aside}</AuthAside>
      </AuthAsideWrapper>
      <AuthContainer
        sx={{
          display: props.showMenuInMobile ? "none" : "flex",
        }}
      >
        <AuthMainWrapper>
          <main>
            <Container>{props.children}</Container>
          </main>
        </AuthMainWrapper>
        <AuthFooterWrapper>
          <footer>
            <Container>{props.footer}</Container>
          </footer>
        </AuthFooterWrapper>
      </AuthContainer>
    </>
  );
};

export const BlankLayout = (props: React.PropsWithChildren) => {
  return (
    <Box
      sx={{
        padding: 6,
        backgroundColor(t) {
          return t.palette.grey[300];
        },
      }}
    >
      <Stack spacing={6}>{props.children}</Stack>
    </Box>
  );
};

const IMAGE_SIZE = 1024;
const ICON_SIZE = (IMAGE_SIZE * 1) / 2;
const MAIN_SIZE = 120;

const GuestAside = styled("aside")(({ theme }) => ({
  position: "fixed",
  zIndex: theme.zIndex.appBar - 1,
  inset: 0,

  inlineSize: "100dvw",
  blockSize: "100dvh",

  [theme.breakpoints.up("sm")]: {
    paddingInlineEnd: theme.spacing(MAIN_SIZE),
  },
}));

const GuestMain = styled("main")(({ theme }) => ({
  position: "fixed",
  zIndex: theme.zIndex.appBar,
  insetInlineEnd: 0,
  insetBlock: 0,

  inlineSize: "100dvw",
  blockSize: "100dvh",

  backgroundColor: alpha(theme.palette.background.default, 0.95),
  backdropFilter: "blur(8px)",

  [theme.breakpoints.up("sm")]: {
    maxInlineSize: theme.spacing(MAIN_SIZE),

    borderInlineStart: `1px solid ${theme.palette.divider}`,
  },
}));

const Logo = (props: React.SVGProps<SVGSVGElement> & { bgcolor: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="12" fill={props.bgcolor} />
      <circle cx="12" cy="12" r="1" fill="#FFFFFF" />
      <ellipse
        cx="12"
        cy="12"
        rx="4"
        ry="10"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        transform="rotate(45 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4"
        ry="10"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        transform="rotate(-45 12 12)"
      />
    </svg>
  );
};

export const GuestLayout = (props: React.PropsWithChildren) => {
  const id = React.useId();
  const cvsRef = React.useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  React.useEffect(() => {
    const svg = document.getElementById(id);

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image(ICON_SIZE, ICON_SIZE);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);

      const cvs = cvsRef.current;

      if (!cvs) return;

      const ctx = cvs.getContext("2d");

      if (!ctx) return;

      cvs.width = IMAGE_SIZE;
      cvs.height = IMAGE_SIZE;
      ctx.fillStyle = theme.palette.primary.main;
      ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
      ctx.drawImage(
        img,
        0,
        0,
        IMAGE_SIZE,
        IMAGE_SIZE,
        IMAGE_SIZE / 2 - ICON_SIZE / 2,
        IMAGE_SIZE / 2 - ICON_SIZE / 2,
        IMAGE_SIZE,
        IMAGE_SIZE
      );

      img.remove();
    };
    document.body.append(img);
  }, [id, theme.palette.primary.main]);

  return (
    <>
      <GuestAside>
        {
          void (
            <>
              <Logo
                id={id}
                width={ICON_SIZE}
                height={ICON_SIZE}
                bgcolor={theme.palette.primary.main}
                display={"none"}
              />
              <Box
                display={"flex"}
                border="1px red dash"
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
              >
                <canvas
                  ref={cvsRef}
                  width={IMAGE_SIZE}
                  height={IMAGE_SIZE}
                ></canvas>
              </Box>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.download = "icon.png";
                  link.href = cvsRef.current?.toDataURL("image/png", 1) || "";
                  link.click();
                  link.remove();
                }}
              >
                export
              </button>
            </>
          )
        }
      </GuestAside>
      <GuestMain>{props.children}</GuestMain>
    </>
  );
};
