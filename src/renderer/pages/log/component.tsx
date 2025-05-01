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
import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export const Component = () => {
  const scrollCursorRef = React.useRef<HTMLDivElement>(null);

  const logs = useLiveQuery(() => db.log.toArray(), []);

  React.useEffect(() => {
    if (!logs?.length) return;

    scrollCursorRef.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
    });
  }, [logs?.length]);

  const renderLog = () => {
    return (
      <>
        <CardContent>
          <Grid container spacing={6}>
            <Grid size={12}>
              <List>
                {logs?.map((log) => (
                  <ListItem key={log.id}>
                    <ListItemText
                      primary={log.message}
                      secondary={new Date(log.date).toLocaleString()}
                      sx={{
                        wordBreak: "break-all",
                        overflowWrap: "break-word",
                      }}
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
              db.log.clear();
            }}
          >
            <ClearOutlined />
          </IconButton>
        }
      />
      {renderLog()}
      <div ref={scrollCursorRef}></div>
    </Card>
  );
};
