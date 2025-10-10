import { useSelectFile, useXML } from "@/api/fetch_preload";
import { FindInPageOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import React from "react";

export const Component = () => {
  const [path, setPath] = React.useState("");

  const xml = useXML();
  const selectFile = useSelectFile();

  const handleDirectoryChange = () => {
    selectFile.mutate(
      [
        {
          name: "XML",
          extensions: ["xml", "XML", "txt", "TXT"],
        },
      ],
      {
        onSuccess: ([path]) => {
          setPath(path);
        },
      },
    );
  };

  return (
    <Card>
      <CardContent>
        <Grid container>
          <Grid>
            <TextField
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
              }}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleDirectoryChange}
                        disabled={selectFile.isPending}
                      >
                        <FindInPageOutlined />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button
          onClick={() => {
            xml.mutate(path, {
              onSuccess: (data) => {
                console.log(data);
              },
            });
          }}
        >
          Parse
        </Button>
      </CardActions>
    </Card>
  );
};
