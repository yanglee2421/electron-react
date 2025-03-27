import {
  Box,
  CardContent,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Pagination,
} from "@mui/material";
import {
  CheckCircleOutlined,
  ErrorOutlined,
  InfoOutlined,
  MoreVertOutlined,
  WarningOutlined,
} from "@mui/icons-material";

export const Component = () => {
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

  return <>{renderLog()}</>;
};
