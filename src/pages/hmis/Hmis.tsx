import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClearOutlined,
  CloudUploadOutlined,
  ErrorOutlined,
  InfoOutlined,
  KeyboardReturnOutlined,
  MoreVertOutlined,
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
  TablePagination,
  Pagination,
  Button,
  Box,
  Divider,
  Checkbox,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { useSnackbar } from "notistack";

const schema = z.object({
  barCode: z.string().min(1),
});

const useScanerForm = () =>
  useForm({
    defaultValues: {
      barCode: "",
    },
    resolver: zodResolver(schema),
  });

export const Hmis = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const formId = React.useId();

  const form = useScanerForm();
  const toast = useSnackbar();

  const renderLog = () => {
    return (
      <>
        <CardContent>
          <Grid2 container spacing={6}>
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
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={10}
                  page={1}
                  onChange={() => {}}
                  color="primary"
                  shape="circular"
                />
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </>
    );
  };

  void renderLog;

  return (
    <Card>
      <CardHeader title="扫码" />
      <CardContent>
        <Grid2 container spacing={6}>
          <Grid2 size={{ xs: 12, sm: 10, md: 8, lg: 6, xl: 4 }}>
            <form
              ref={formRef}
              id={formId}
              noValidate
              autoComplete="off"
              onSubmit={form.handleSubmit((data) => {
                toast.enqueueSnackbar(`Scanned: ${data.barCode}`, {
                  variant: "success",
                });
                form.reset();
              }, console.warn)}
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
                            <Button
                              form={formId}
                              type="submit"
                              endIcon={<KeyboardReturnOutlined />}
                              variant="contained"
                            >
                              录入
                            </Button>
                          </InputAdornment>
                        ),
                        autoFocus: true,
                      },
                    }}
                    label="条形码/二维码"
                    placeholder="请扫描条形码或二维码"
                  />
                )}
              />
            </form>
          </Grid2>
        </Grid2>
      </CardContent>
      <Divider />
      <CardContent>
        <Button variant="outlined" startIcon={<CloudUploadOutlined />}>
          上传
        </Button>
      </CardContent>
      <TableContainer sx={{ maxHeight: 560 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox indeterminate />
              </TableCell>
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
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>#1</TableCell>
              <TableCell>43513511354131</TableCell>
              <TableCell>29171</TableCell>
              <TableCell>{new Date().toLocaleString()}</TableCell>
              <TableCell>
                <ClearOutlined />
              </TableCell>
              <TableCell>
                <IconButton>
                  <MoreVertOutlined />
                </IconButton>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>#2</TableCell>
              <TableCell>43513511354131</TableCell>
              <TableCell>29171</TableCell>
              <TableCell>{new Date().toLocaleString()}</TableCell>
              <TableCell>
                <CheckOutlined />
              </TableCell>
              <TableCell>
                <IconButton>
                  <MoreVertOutlined />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox indeterminate />
              </TableCell>
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
      <TablePagination
        component={"div"}
        page={0}
        count={100}
        rowsPerPage={10}
        rowsPerPageOptions={[10, 20, 30]}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        labelRowsPerPage="每页行数"
      />
    </Card>
  );
};
