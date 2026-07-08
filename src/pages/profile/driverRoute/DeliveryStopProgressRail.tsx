import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { TickCircle } from "iconsax-react-native";
import type { DeliveryStopProgressStep } from "./deliveryStopProgress";
import { deliveryStopProgressHeadline } from "./deliveryStopProgress";
import {
  DELIVERY_ROUTE_PROGRESS_RAIL_METRICS,
  type DeliveryRouteProgressRailSize,
} from "./deliveryRouteProgressTheme";
import {
  buildWormRowIndices,
  computeStepsPerRow,
  shouldUseWormLayout,
} from "./deliveryRouteProgressWorm";
import { rgba } from "./driverRouteGlass";

const SCROLL_STEP_THRESHOLD = 9;

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
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: 3,
                }
              : isCurrent
                ? {
                    borderColor: accentColor,
                    backgroundColor: "#FFFFFF",
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 5,
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

function resolveHorizontalModes(input: {
  globalIndex: number;
  rowIndices: number[];
  rowReversed: boolean;
  steps: DeliveryStopProgressStep[];
}): { leftMode: ConnectorMode; rightMode: ConnectorMode } {
  const { globalIndex, rowIndices, rowReversed, steps } = input;
  const step = steps[globalIndex]!;
  const prev = steps[globalIndex - 1];
  const next = steps[globalIndex + 1];
  const prevInRow = rowIndices.includes(globalIndex - 1);
  const nextInRow = rowIndices.includes(globalIndex + 1);

  if (!rowReversed) {
    return {
      leftMode: prevInRow ? resolveConnectorMode(prev?.state, step.state) : "hidden",
      rightMode: nextInRow ? resolveConnectorMode(step.state, next?.state) : "hidden",
    };
  }

  return {
    leftMode: nextInRow ? resolveConnectorMode(step.state, next?.state) : "hidden",
    rightMode: prevInRow ? resolveConnectorMode(prev?.state, step.state) : "hidden",
  };
}

function WormBridge(props: {
  side: "left" | "right";
  accentColor: string;
  mode: ConnectorMode;
  columnFraction: number;
}) {
  if (props.mode === "hidden") return null;
  const color = connectorColor(props.accentColor, props.mode);
  return (
    <View
      style={[
        styles.bridgeRow,
        props.side === "right" ? styles.bridgeRowRight : styles.bridgeRowLeft,
      ]}
    >
      <View style={[styles.bridgeCol, { width: `${props.columnFraction * 100}%` }]}>
        <View
          style={[
            styles.bridgeVertical,
            color ? { backgroundColor: color } : styles.connectorMuted,
          ]}
        />
      </View>
    </View>
  );
}

function WormStepRail(props: {
  steps: DeliveryStopProgressStep[];
  accentColor: string;
  size: DeliveryRouteProgressRailSize;
  stepsPerRow: number;
  contentWidth: number;
  dotScales: Animated.Value[];
  labelOpacities: Animated.Value[];
}) {
  const { steps, accentColor, size, stepsPerRow, contentWidth, dotScales, labelOpacities } =
    props;
  const wormRows = buildWormRowIndices(steps.length, stepsPerRow);
  const columnWidth = contentWidth / stepsPerRow;
  const columnFraction = 1 / stepsPerRow;

  return (
    <View style={styles.wormWrap}>
      {wormRows.map((rowIndices, rowIndex) => {
        const rowReversed = rowIndex % 2 === 1;
        const displayIndices = rowReversed ? [...rowIndices].reverse() : rowIndices;
        const prevRow = wormRows[rowIndex - 1];
        const isPartialRow = rowIndices.length < stepsPerRow;
        const bridgeSide: "left" | "right" =
          rowIndex > 0 ? (rowIndex % 2 === 1 ? "right" : "left") : "right";
        const bridgeFrom = prevRow?.[prevRow.length - 1];
        const bridgeTo = rowIndices[0];
        const bridgeMode =
          rowIndex > 0 && bridgeFrom !== undefined && bridgeTo !== undefined
            ? resolveConnectorMode(steps[bridgeFrom]?.state, steps[bridgeTo]?.state)
            : "hidden";

        return (
          <View key={`worm-row-${rowIndex}`}>
            {rowIndex > 0 ? (
              <WormBridge
                side={bridgeSide}
                accentColor={accentColor}
                mode={bridgeMode}
                columnFraction={columnFraction}
              />
            ) : null}
            <View
              style={[
                styles.wormRow,
                isPartialRow
                  ? rowReversed
                    ? styles.wormRowEnd
                    : rowIndex > 0
                      ? styles.wormRowStart
                      : null
                  : null,
              ]}
            >
              {displayIndices.map((globalIndex) => {
                const modes = resolveHorizontalModes({
                  globalIndex,
                  rowIndices,
                  rowReversed,
                  steps,
                });
                return (
                  <StepCell
                    key={steps[globalIndex]!.key}
                    step={steps[globalIndex]!}
                    globalIndex={globalIndex}
                    accentColor={accentColor}
                    size={size}
                    flex={false}
                    fixedWidth={columnWidth}
                    leftMode={modes.leftMode}
                    rightMode={modes.rightMode}
                    dotScale={dotScales[globalIndex]!}
                    labelOpacity={labelOpacities[globalIndex]!}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
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
  const useScroll = steps.length > SCROLL_STEP_THRESHOLD;
  const isInline = variant === "inline";
  const [layoutWidth, setLayoutWidth] = useState(0);
  const stepsPerRow = computeStepsPerRow(layoutWidth, size);
  const useWorm = shouldUseWormLayout(steps, layoutWidth, size);
  const dotScalesRef = useRef<Animated.Value[]>([]);
  const labelOpacitiesRef = useRef<Animated.Value[]>([]);
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  if (dotScalesRef.current.length !== steps.length) {
    dotScalesRef.current = steps.map(() => new Animated.Value(0.2));
  }
  if (labelOpacitiesRef.current.length !== steps.length) {
    labelOpacitiesRef.current = steps.map(() => new Animated.Value(0));
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - layoutWidth) > 1) {
      setLayoutWidth(width);
    }
  };

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

  const railBody = useWorm ? (
    <WormStepRail
      steps={steps}
      accentColor={accentColor}
      size={size}
      stepsPerRow={stepsPerRow}
      contentWidth={layoutWidth}
      dotScales={dotScalesRef.current}
      labelOpacities={labelOpacitiesRef.current}
    />
  ) : useScroll ? (
    <ScrollView
      horizontal
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
  ) : (
    <View style={styles.flexRow}>
      <LinearStepRail
        steps={steps}
        accentColor={accentColor}
        size={size}
        useScroll={false}
        dotScales={dotScalesRef.current}
        labelOpacities={labelOpacitiesRef.current}
      />
    </View>
  );

  return (
    <View
      onLayout={onLayout}
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  wrapInline: {
    width: "100%",
    paddingVertical: 4,
  },
  wrapLg: {
    paddingVertical: 6,
  },
  wrapCompact: {
    marginTop: 0,
  },
  headline: {
    marginBottom: 8,
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  wormWrap: {
    width: "100%",
    gap: 0,
  },
  wormRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  wormRowEnd: {
    justifyContent: "flex-end",
  },
  wormRowStart: {
    justifyContent: "flex-start",
  },
  bridgeRow: {
    width: "100%",
    height: 14,
    justifyContent: "flex-end",
  },
  bridgeRowRight: {
    alignItems: "flex-end",
  },
  bridgeRowLeft: {
    alignItems: "flex-start",
  },
  bridgeCol: {
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 48,
  },
  bridgeVertical: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "flex-start",
    paddingRight: 4,
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
    width: "100%",
  },
  dotUpcoming: {
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E2E8F0",
  },
  stepLabel: {
    marginTop: 5,
    width: "100%",
    textAlign: "center",
    fontWeight: "700",
  },
  stepLabelCurrent: {
    color: "#0F172A",
  },
  stepLabelDone: {
    color: "#1E293B",
  },
  stepLabelUpcoming: {
    color: "#94A3B8",
  },
});
