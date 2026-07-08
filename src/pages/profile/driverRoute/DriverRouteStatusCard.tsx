import React from "react";
import { StyleSheet, View } from "react-native";
import type { DeliveryStopProgressStep } from "./deliveryStopProgress";
import { DeliveryStopProgressRail } from "./DeliveryStopProgressRail";
import {
  DELIVERY_ROUTE_PROGRESS_ACCENT,
  type DeliveryRouteProgressRailSize,
} from "./deliveryRouteProgressTheme";

export type DriverRouteStatusCardProps = {
  routeComplete: boolean;
  routeInProcess: boolean;
  deliveredStopCount: number;
  totalStopCount: number;
  progressSteps?: DeliveryStopProgressStep[];
  progressAccentColor?: string;
  progressSize?: DeliveryRouteProgressRailSize;
};

function resolveAccentColor(props: DriverRouteStatusCardProps): string {
  if (props.progressAccentColor) return props.progressAccentColor;
  if (props.routeComplete) return DELIVERY_ROUTE_PROGRESS_ACCENT.complete;
  if (props.routeInProcess) return DELIVERY_ROUTE_PROGRESS_ACCENT.inProcess;
  return DELIVERY_ROUTE_PROGRESS_ACCENT.pending;
}

export function DriverRouteStatusCard(props: DriverRouteStatusCardProps) {
  if (!props.progressSteps || props.progressSteps.length === 0) return null;

  return (
    <View style={s.wrap}>
      <DeliveryStopProgressRail
        steps={props.progressSteps}
        accentColor={resolveAccentColor(props)}
        showHeadline={false}
        compact
        variant="inline"
        size={props.progressSize ?? "lg"}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: "100%",
  },
});
