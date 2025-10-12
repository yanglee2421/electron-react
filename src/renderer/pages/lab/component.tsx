import { useLab } from "#renderer/api/fetch_preload";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  TextField,
} from "@mui/material";
import React from "react";

const fileListToPaths = (fileList: FileList) => {
  return Array.from(fileList, (file) =>
    window.electron.webUtils.getPathForFile(file),
  );
};

export const Component = () => {
  const [paths, setPaths] = React.useState<string[]>([]);

  const lab = useLab();

  return (
    <Card>
      <CardHeader title="实验室" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              onDrop={(e) => {
                e.preventDefault();
                setPaths(fileListToPaths(e.dataTransfer.files));
              }}
              onPaste={(e) => {
                setPaths(fileListToPaths(e.clipboardData.files));
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ul>
              {paths.map((path) => (
                <li key={path}>{path}</li>
              ))}
            </ul>
          </Grid>
          <Grid size={{ xs: 12 }}>实验室功能正在开发中，敬请期待！</Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button
          onClick={() => {
            lab.mutate(paths, {
              onError: (error) => {
                console.error(error);
              },
              onSuccess: (data) => {
                console.log(data);
              },
            });
          }}
        >
          Go
        </Button>
      </CardActions>
    </Card>
  );
};
