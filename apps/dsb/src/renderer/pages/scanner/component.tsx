import { KeyboardReturn, Remove } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  createTheme,
  CssBaseline,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  ThemeProvider,
} from "@mui/material";
import React from "react";
import { concatMap, delay, distinctUntilChanged, of, Subject, tap } from "rxjs";

const theme = createTheme({ palette: { mode: "dark" } });
const sub$ = new Subject<string>();

export const Component = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ padding: 1.5 }}>
        <Scanner />
      </Box>
      <CssBaseline />
    </ThemeProvider>
  );
};

const Scanner = () => {
  const [qrcode, setQrcode] = React.useState("");
  const [list, setList] = React.useState<
    Array<{
      qrcode: string;
    }>
  >([]);

  const formId = React.useId();

  React.useEffect(() => {
    const sub = sub$
      .pipe(
        distinctUntilChanged(),
        concatMap((qrcode) => {
          return of({ qrcode }).pipe(delay(Math.random() * 100 * 2 + 100));
        }),
        tap((item) => {
          setList((list) => [...list, item]);
        }),
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [setList]);

  return (
    <Stack>
      <Card>
        <CardHeader
          title="Scanner"
          action={
            <IconButton
              onClick={() => {
                setList([]);
              }}
            >
              <Remove />
            </IconButton>
          }
        />
        <CardContent>
          <form
            id={formId}
            onSubmit={(e) => {
              e.stopPropagation();
              e.preventDefault();
              sub$.next(qrcode);
              setQrcode("");
            }}
          >
            <TextField
              value={qrcode}
              onChange={(e) => {
                setQrcode(e.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        form={formId}
                        type="submit"
                        endIcon={<KeyboardReturn />}
                        variant="contained"
                      >
                        Go
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </form>
        </CardContent>
      </Card>
      <Card>
        <List>
          {list.map((item) => {
            return (
              <ListItem key={item.qrcode}>
                <ListItemText primary={item.qrcode} />
              </ListItem>
            );
          })}
        </List>
      </Card>
    </Stack>
  );
};