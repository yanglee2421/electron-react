import { useSelectDirectory, useSelectFile } from "#renderer/api/fetch_preload";
import { PendingIcon } from "#renderer/components/Loading";
import { NumberField } from "#renderer/components/number";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { FindInPageOutlined } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";

export const Component = () => {
  const selectFile = useSelectFile();
  const selectDirectory = useSelectDirectory();
  const qtAppPath = useProfileStore((s) => s.qtAppPath);
  const qtHMISEnabled = useProfileStore((s) => s.qtHMISEnabled);
  const qtHMISPort = useProfileStore((s) => s.qtHMISPort);
  const form = useForm({
    defaultValues: {
      qtAppPath,
      qtHMISEnabled,
      qtHMISPort,
      databaseDirectory: "",
    },
  });

  return (
    <>
      <Card>
        <CardHeader title="配置QT软件" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="软件目录"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton>
                          <PendingIcon>
                            <FindInPageOutlined />
                          </PendingIcon>
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="数据库目录"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton>
                          <PendingIcon>
                            <FindInPageOutlined />
                          </PendingIcon>
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel label={"启用HMIS代理"} control={<Switch />} />
            </Grid>
            <Grid size={12}>
              <NumberField
                fullWidth
                field={{ value: 5003, onChange: () => {}, onBlur: () => {} }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button>Save</Button>
        </CardActions>
      </Card>
    </>
  );
};