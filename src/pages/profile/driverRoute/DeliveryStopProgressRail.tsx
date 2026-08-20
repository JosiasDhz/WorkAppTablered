import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TickCircle } from "iconsax-react-native";
import type { DeliveryStopProgressStep } from "./deliveryStopProgress";
import { deliveryStopProgressHeadline } from "./deliveryStopProgress";
import {
  DELIVERY_ROUTE_PROGRESS_RAIL_METRICS,
  type DeliveryRouteProgressRailSize,
} from "./deliveryRouteProgressTheme";
import { rgba } from "./driverRouteGlass";

type ConnectorMode = "full" | "partial" | "faint" | "muted" | "hidden";

function resolveConnectorMode(
  from: DeliveryStopProgressStep["state"] | undefined,
  to: DeliveryStopProgressStep["state"] | undefined,
): ConnectorMode {
  if (from === "done" && to === "done") return "full";
  if (from === "done" && to === "current") return "partial";
  if (from === "current" || to === "current") return "faint";
  return "muted";
}

function connectorColor(
  accentColor: string,
  mode: Exclude<ConnectorMode, "hidden">,
): string | undefined {
  if (mode === "full") return accentColor;
  if (mode === "partial") return rgba(accentColor, 0.55);
  if (mode === "faint") return rgba(accentColor, 0.28);
  return undefined;
}

function StepCell(props: {
  step: DeliveryStopProgressStep;
  globalIndex: number;
  accentColor: string;
  size: DeliveryRouteProgressRailSize;
  flex: boolean;
  fixedWidth?: number;
  leftMode: ConnectorMode;
  rightMode: ConnectorMode;
  dotScale: Animated.Value;
  labelOpacity: Animated.Value;
}) {
  const {
    step,
    accentColor,
    size,
    flex,
    fixedWidth,
    leftMode,
    rightMode,
    dotScale,
    labelOpacity,
  } = props;
  const metrics = DELIVERY_ROUTE_PROGRESS_RAIL_METRICS[size];
  const dotRadius = metrics.dot / 2;
  const isDone = step.state === "done";
  const isCurrent = step.state === "current";
  const leftColor = leftMode === "hidden" ? undefined : connectorColor(accentColor, leftMode);
  const rightColor = rightMode === "hidden" ? undefined : connectorColor(accentColor, rightMode);

  return (
    <View
      style={[
        styles.stepCol,
        flex ? styles.stepColFlex : null,
        fixedWidth ? { width: fixedWidth } : null,
      ]}
    >
      <View style={[styles.stepTop, { height: metrics.rowHeight }]}>
        <Animated.View
          style={[
            styles.connector,
            { height: metrics.connector },
            leftMode === "hidden" ? styles.connectorHidden : null,
            leftColor ? { backgroundColor: leftColor } : styles.connectorMuted,
          ]}
        />
        <Animated.View
          style={[
            {
              width: metrics.dot,
              height: metrics.dot,
              borderRadius: dotRadius,
              borderWidth: 2,
              alignItems: "center",
              justifyContent: "center",
            },
            { transform: [{ scale: dotScale }] },
            isDone
              ? {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                }
              : isCurrent
                ? {
                    borderColor: accentColor,
                    backgroundColor: "#FFFFFF",
                  }
                : styles.dotUpcoming,
          ]}
        >
          {isDone ? (
            <TickCircle size={metrics.check} color="#FFFFFF" variant="Bold" />
          ) : isCurrent ? (
            <View
              style={{
                width: metrics.dotInner,
                height: metrics.dotInner,
                borderRadius: metrics.dotInner / 2,
                backgroundColor: accentColor,
              }}
            />
          ) : null}
        </Animated.View>
        <Animated.View
          style={[
            styles.connector,
            { height: metrics.connector },
            rightMode === "hidden" ? styles.connectorHidden : null,
            rightColor ? { backgroundColor: rightColor } : styles.connectorMuted,
          ]}
        />
      </View>
      <Animated.Text
        style={[
          styles.stepLabel,
          {
            fontSize: metrics.label,
            lineHeight: metrics.label + 2,
            opacity: labelOpacity,
          },
          isCurrent
            ? styles.stepLabelCurrent
            : isDone
              ? styles.stepLabelDone
              : styles.stepLabelUpcoming,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {step.shortLabel}
      </Animated.Text>
    </View>
  );
}

function LinearStepRail(props: {
  steps: DeliveryStopProgressStep[];
  accentColor: string;
  size: DeliveryRouteProgressRailSize;
  useScroll: boolean;
  dotScales: Animated.Value[];
  labelOpacities: Animated.Value[];
}) {
  const { steps, accentColor, size, useScroll, dotScales, labelOpacities } = props;
  const metrics = DELIVERY_ROUTE_PROGRESS_RAIL_METRICS[size];

  return (
    <>
      {steps.map((step, index) => {
        const prev = steps[index - 1];
        const next = steps[index + 1];
        const leftMode =
          index === 0 ? "hidden" : resolveConnectorMode(prev?.state, step.state);
        const rightMode =
          index === steps.length - 1
            ? "hidden"
            : resolveConnectorMode(step.state, next?.state);

        return (
          <StepCell
            key={step.key}
            step={step}
            globalIndex={index}
            accentColor={accentColor}
            size={size}
            flex={!useScroll}
            fixedWidth={useScroll ? metrics.stepColScroll : undefined}
            leftMode={leftMode}
            rightMode={rightMode}
            dotScale={dotScales[index]!}
            labelOpacity={labelOpacities[index]!}
          />
        );
      })}
    </>
  );
}

export function DeliveryStopProgressRail(props: {
  steps: DeliveryStopProgressStep[];
  accentColor: string;
  headline?: string;
  showHeadline?: boolean;
  compact?: boolean;
  variant?: "card" | "inline";
  size?: DeliveryRouteProgressRailSize;
}) {
  const {
    steps,
    accentColor,
    compact = false,
    showHeadline = true,
    variant = "card",
    size = "md",
  } = props;
  const headline = props.headline ?? deliveryStopProgressHeadline(steps);
  const isInline = variant === "inline";
  const dotScalesRef = useRef<Animated.Value[]>([]);
  const labelOpacitiesRef = useRef<Animated.Value[]>([]);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  if (dotScalesRef.current.length !== steps.length) {
    dotScalesRef.current = steps.map(() => new Animated.Value(0.2));
  }
  if (labelOpacitiesRef.current.length !== steps.length) {
    labelOpacitiesRef.current = steps.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    pulseRef.current?.stop();

    const entrance = Animated.stagger(
      70,
      steps.map((_, index) =>
        Animated.parallel([
          Animated.spring(dotScalesRef.current[index]!, {
            toValue: 1,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
          }),
          Animated.timing(labelOpacitiesRef.current[index]!, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    entrance.start();

    const currentIndex = steps.findIndex((step) => step.state === "current");
    if (currentIndex >= 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(dotScalesRef.current[currentIndex]!, {
            toValue: 1.12,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(dotScalesRef.current[currentIndex]!, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseRef.current = pulse;
      pulse.start();
    }

    return () => {
      pulseRef.current?.stop();
    };
  }, [steps, accentColor]);

  const railBody = (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <LinearStepRail
        steps={steps}
        accentColor={accentColor}
        size={size}
        useScroll
        dotScales={dotScalesRef.current}
        labelOpacities={labelOpacitiesRef.current}
      />
    </ScrollView>
  );

  return (
    <View
      style={[
        isInline ? styles.wrapInline : styles.wrap,
        compact && !isInline ? styles.wrapCompact : null,
        size === "lg" ? styles.wrapLg : null,
      ]}
    >
      {showHeadline ? (
        <Text style={styles.headline} numberOfLines={1}>
          {headline}
        </Text>
      ) : null}
      {railBody}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  wrapInline: {
    width: "100%",
    alignSelf: "stretch",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  wrapLg: {
    paddingVertical: 0,
  },
  wrapCompact: {
    marginTop: 0,
  },
  headline: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  stepCol: {
    alignItems: "center",
  },
  stepColFlex: {
    flex: 1,
    minWidth: 0,
  },
  stepTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  dotUpcoming: {
    borderColor: "rgba(60, 60, 67, 0.22)",
    backgroundColor: "rgba(60, 60, 67, 0.08)",
  },
  connector: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minWidth: 4,
  },
  connectorHidden: {
    opacity: 0,
  },
  connectorMuted: {
    backgroundColor: "rgba(60, 60, 67, 0.16)",
  },
  stepLabel: {
    marginTop: 6,
    width: "100%",
    textAlign: "center",
    fontWeight: "700",
  },
  stepLabelCurrent: {
    color: "#EA7600",
  },
  stepLabelDone: {
    color: "#1C1C1E",
  },
  stepLabelUpcoming: {
    color: "#8E8E93",
  },
});
