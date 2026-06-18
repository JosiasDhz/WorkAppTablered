import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { TableRedColors } from "../../../theme/tableRedColors";
import { DriverRouteTripMapWebView } from "../driverRoute/DriverRouteTripMapWebView";
import { loadDriverRouteMapAssignment } from "../driverRoute/loadDriverRouteMapAssignment";
import { tripMapModelFromAssignment } from "../driverRoute/tripMapModelFromAssignment";
import type { TripMapModel } from "../driverRoute/tripMapModelFromAssignment";

const PREVIEW_HEIGHT = 118;
const CARD_MAP_PADDING = { top: 10, right: 10, bottom: 10, left: 10 };

type Props = {
  routeId: string;
  height?: number;
};

export function DriverRouteCardMapPreview({ routeId, height = PREVIEW_HEIGHT }: Props) {
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

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <DriverRouteTripMapWebView
        model={model}
        height={height}
        fitPadding={CARD_MAP_PADDING}
        mapFitOptions={{ zoomBoost: true }}
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
