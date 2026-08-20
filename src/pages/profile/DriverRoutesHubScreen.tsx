import React from "react";
import { useTabBarAutoCollapseScroll } from "../../routes/tabBar/TabBarMotionContext";
import { useDriverPendingRoutes } from "./hooks/useDriverPendingRoutes";
import { DriverAssignedRoutesHub } from "./components/DriverAssignedRoutesHub";

export default function DriverRoutesHubScreen() {
  const routesState = useDriverPendingRoutes(true);
  const onAutoTabBarScroll = useTabBarAutoCollapseScroll();

  return (
    <DriverAssignedRoutesHub
      routes={routesState}
      onScroll={onAutoTabBarScroll}
    />
  );
}
