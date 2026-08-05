import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { TableRedColors } from "../../../theme/tableRedColors";
import { DriverRouteTripMapWebView } from "../driverRoute/DriverRouteTripMapWebView";
import { loadDriverRouteMapAssignment } from "../driverRoute/loadDriverRouteMapAssignment";
import { tripMapModelFromAssignment } from "../driverRoute/tripMapModelFromAssignment";
import type { TripMapModel } from "../driverRoute/tripMapModelFromAssignment";

const PREVIEW_HEIGHT = 118;
const CARD_MAP_PADDING = { top: 30, right: 30, bottom: 30, left: 30 };

type Props = {
  routeId: string;
  height?: number;
  routeComplete?: boolean;
  routeInProcess?: boolean;
  routeCancelled?: boolean;
};

export function DriverRouteCardMapPreview({
  routeId,
  height = PREVIEW_HEIGHT,
  routeComplete = false,
  routeInProcess = false,
  routeCancelled = false,
}: Props) {
  const [model, setModel] = useState<TripMapModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setModel(null);

    void loadDriverRouteMapAssignment(routeId)
      .then((detail) => {
        if (cancelled) return;
        setModel(detail ? tripMapModelFromAssignment(detail) : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  if (loading) {
    return (
      <View style={[styles.loading, { height }]}>
        <ActivityIndicator size="small" color={TableRedColors.naranja} />
      </View>
    );
  }

  if (!model || (model.path.length === 0 && model.stops.length === 0)) {
    return <View style={[styles.fallback, { height }]} />;
  }

  const strokeColor = routeCancelled
    ? "#E11D48"
    : routeComplete
      ? "#10B981"
      : "#EA7600";

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <DriverRouteTripMapWebView
        model={model}
        height={height}
        fitPadding={CARD_MAP_PADDING}
        mapFitOptions={{
          zoomBoost: true,
          animateDraw: false,
          strokeColor,
        }}
        embedded
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: PREVIEW_HEIGHT,
    backgroundColor: TableRedColors.crema,
  },
  loading: {
    height: PREVIEW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TableRedColors.crema,
  },
  fallback: {
    height: PREVIEW_HEIGHT,
    backgroundColor: TableRedColors.crema,
  },
});
