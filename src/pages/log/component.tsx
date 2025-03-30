import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ClearOutlined } from "@mui/icons-material";
import { useIndexedStore } from "@/hooks/useIndexedStore";

export const Component = () => {
  const logs = useIndexedStore((s) => s.logs);
  const set = useIndexedStore((s) => s.set);

  const renderLog = () => {
    return (
      <>
        <CardContent>
          <Grid container spacing={6}>
            <Grid size={12}>
              <List>
                {logs.map((log) => (
                  <ListItem key={log.id}>
                    <ListItemText
                      primary={log.message}
                      secondary={new Date(log.date).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </>
    );
  };

  return (
    <Card>
      <CardHeader
        title="日志"
        action={
          <IconButton
            onClick={() => {
              set((d) => {
                d.logs = [];
              });
            }}
          >
            <ClearOutlined />
          </IconButton>
        }
      />
      {renderLog()}
    </Card>
  );
};
