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
  Tabs,
  Tab,
  TablePagination,
  Pagination,
  Box,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";

const schema = z.object({
  barCode: z.string().min(1),
});

export const Hmis = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const form = useForm({
    defaultValues: {
      barCode: "",
    },
    resolver: zodResolver(schema),
  });

  const renderRefreshButton = () => {
    if (activeTab !== 1) return null;
    return (
      <IconButton>
        <RefreshOutlined />
      </IconButton>
    );
  };

  const renderHistory = () => {
    return (
      <>
        <CardContent>
          <Grid2 container spacing={6}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <DatePicker slotProps={{ textField: { fullWidth: true } }} />
            </Grid2>
          </Grid2>
        </CardContent>
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
        <TablePagination
          component={"div"}
          page={0}
          count={100}
          rowsPerPage={10}
          rowsPerPageOptions={[10, 20, 30]}
          onPageChange={() => {}}
          onRowsPerPageChange={() => {}}
        />
      </>
    );
  };

  const renderBarCodeScanner = () => {
    return (
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
                        autoFocus: true,
                      },
                    }}
                    variant="standard"
                    label="Barcode"
                  />
                )}
              />
            </form>
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
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderBarCodeScanner();
      case 1:
        return renderHistory();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader title="HMIS" action={renderRefreshButton()} />
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={(t) => ({ borderBottom: `1px solid ${t.palette.divider}` })}
      >
        <Tab label="Bar Code Scanner" value={0} />
        <Tab label="History" value={1} />
      </Tabs>
      {renderTabContent()}
    </Card>
  );
};
