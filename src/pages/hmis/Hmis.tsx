import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckBoxOutlineBlankOutlined,
  CheckBoxOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  InfoOutlined,
  KeyboardReturnOutlined,
  MoreVertOutlined,
  RefreshOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Grid2,
  IconButton,
  InputAdornment,
  Table,
  TableContainer,
  TableFooter,
  TextField,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  barCode: z.string().min(1),
});

export const Hmis = () => {
  const form = useForm({
    defaultValues: {
      barCode: "",
    },
    resolver: zodResolver(schema),
  });

  return (
    <Card>
      <CardHeader
        title="HMIS"
        action={
          <IconButton>
            <RefreshOutlined />
          </IconButton>
        }
      />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={12}>
            <form
              noValidate
              autoComplete="off"
              onSubmit={form.handleSubmit((data) => {
                alert("submit" + data.barCode);
              }, console.error)}
              onReset={() => form.reset()}
            >
              <Controller
                control={form.control}
                name="barCode"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton type="submit">
                              <KeyboardReturnOutlined />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    variant="standard"
                    label="Barcode"
                  />
                )}
              />
            </form>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <DatePicker slotProps={{ textField: { fullWidth: true } }} />
          </Grid2>
          <Grid2 size={12}>
            <TableContainer sx={{ maxHeight: 560 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>单号</TableCell>
                    <TableCell>轴号</TableCell>
                    <TableCell>时间</TableCell>
                    <TableCell>已上传</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>#1</TableCell>
                    <TableCell>43513511354131</TableCell>
                    <TableCell>29171</TableCell>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>
                      <CheckBoxOutlineBlankOutlined />
                    </TableCell>
                    <TableCell>
                      <IconButton>
                        <UploadOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>#2</TableCell>
                    <TableCell>43513511354131</TableCell>
                    <TableCell>29171</TableCell>
                    <TableCell>{new Date().toLocaleString()}</TableCell>
                    <TableCell>
                      <CheckBoxOutlined />
                    </TableCell>
                    <TableCell>
                      <IconButton>
                        <UploadOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Footer</TableCell>
                    <TableCell>Footer</TableCell>
                    <TableCell>Footer</TableCell>
                    <TableCell>Footer</TableCell>
                    <TableCell>Footer</TableCell>
                    <TableCell>Footer</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Grid2>
          <Grid2 size={12}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ErrorOutlined color="error" />
                </ListItemIcon>
                <ListItemText primary="error message" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoOutlined color="info" />
                </ListItemIcon>
                <ListItemText primary="error message" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningOutlined color="warning" />
                </ListItemIcon>
                <ListItemText primary="error message" />
              </ListItem>
              <ListItem
                secondaryAction={
                  <IconButton>
                    <MoreVertOutlined />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <CheckCircleOutlined color="success" />
                </ListItemIcon>
                <ListItemText primary="error message" />
              </ListItem>
            </List>
          </Grid2>
        </Grid2>
      </CardContent>
    </Card>
  );
};
