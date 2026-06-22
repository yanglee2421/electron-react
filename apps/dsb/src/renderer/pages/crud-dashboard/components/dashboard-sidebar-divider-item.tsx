import { Divider } from "@mui/material";
import React from "react";
import DashboardSidebarContext from "../context/dashboard-sidebar-context";
import getDrawerSxTransitionMixin from "../mixins";

export default function DashboardSidebarDividerItem() {
  const sidebarContext = React.useContext(DashboardSidebarContext);
  if (!sidebarContext) {
    throw new Error("Sidebar context was used without a provider.");
  }
  const { fullyExpanded = true, hasDrawerTransitions } = sidebarContext;

  return (
    <li>
      <Divider
        sx={[
          {
            borderBottomWidth: 1,
            my: 1,
            mx: -0.5,
          },
          hasDrawerTransitions
            ? getDrawerSxTransitionMixin(fullyExpanded, "margin")
            : null,
        ]}
      />
    </li>
  );
}
