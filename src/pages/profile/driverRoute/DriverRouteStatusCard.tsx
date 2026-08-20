import React from "react";
import { StyleSheet, View } from "react-native";
import type { DeliveryStopProgressStep } from "./deliveryStopProgress";
import { DeliveryStopProgressRail } from "./DeliveryStopProgressRail";

const ACCENT = "#EA7600";

export type DriverRouteStatusCardProps = {
  progressSteps?: DeliveryStopProgressStep[];
  progressAccentColor?: string;
};

export function DriverRouteStatusCard(props: DriverRouteStatusCardProps) {
  const steps = props.progressSteps ?? [];
  if (steps.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <DeliveryStopProgressRail
        steps={steps}
        accentColor={props.progressAccentColor ?? ACCENT}
        showHeadline={false}
        compact
        variant="inline"
        size="lg"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
  },
});
