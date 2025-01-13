import { getAuth, signInWithPopup } from "firebase/auth";
import {
  app,
  auth,
  githubAuthProvider,
  googleAuthProvider,
} from "@/api/firebase/app";
import { Button } from "@mui/material";
import { GitHub } from "@mui/icons-material";
import { Google } from "@/components/svg/Google";

export const SignInWithGithub = () => {
  return (
    <Button
      onClick={() => {
        signInWithPopup(getAuth(app), githubAuthProvider);
      }}
      variant={"contained"}
      color="inherit"
      size="large"
      fullWidth
      startIcon={<GitHub />}
      sx={{ bgcolor: "black", color: "white" }}
    >
      Sign in with Github
    </Button>
  );
};

export const SignInWithGoogle = () => {
  return (
    <Button
      onClick={() => {
        signInWithPopup(auth, googleAuthProvider);
      }}
      size="large"
      variant="outlined"
      color="inherit"
      fullWidth
      startIcon={<Google width={"1em"} height={"1em"} />}
      sx={{
        borderColor(theme) {
          return theme.palette.divider;
        },
        color(theme) {
          return theme.palette.text.secondary;
        },
      }}
    >
      Sign in with Google
    </Button>
  );
};
