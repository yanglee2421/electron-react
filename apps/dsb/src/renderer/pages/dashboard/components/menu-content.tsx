import {
  AnalyticsRounded,
  AssignmentRounded,
  HelpRounded,
  HomeRounded,
  InfoRounded,
  PeopleRounded,
  SettingsRounded,
} from "@mui/icons-material";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import { Link } from "react-router";

const mainListItems = [
  { text: "Home", icon: <HomeRounded /> },
  { text: "Analytics", icon: <AnalyticsRounded /> },
  { text: "Clients", icon: <PeopleRounded /> },
  { text: "Tasks", icon: <AssignmentRounded /> },
];

const secondaryListItems = [
  { text: "Settings", icon: <SettingsRounded /> },
  { text: "About", icon: <InfoRounded /> },
  { text: "Feedback", icon: <HelpRounded /> },
];

export default function MenuContent() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: "space-between" }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem
            key={index}
            disablePadding
            sx={{ display: "block", color: "inherit" }}
            component={Link}
            to={{
              pathname: "/crud-dashboard",
            }}
          >
            <ListItemButton selected={index === 0}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: "block" }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
