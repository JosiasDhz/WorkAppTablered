import type { DeliveryRouteProgressRailSize } from "./deliveryRouteProgressTheme";
import { DELIVERY_ROUTE_PROGRESS_RAIL_METRICS } from "./deliveryRouteProgressTheme";

export function computeStepsPerRow(
  contentWidth: number,
  size: DeliveryRouteProgressRailSize,
): number {
  const metrics = DELIVERY_ROUTE_PROGRESS_RAIL_METRICS[size];
  const minCol = Math.max(metrics.stepColScroll - 8, size === "lg" ? 54 : 46);
  const available = Math.max(0, contentWidth);
  const perRow = Math.floor(available / minCol);
  return Math.max(3, Math.min(5, perRow));
}

export function buildWormRowIndices(stepCount: number, stepsPerRow: number): number[][] {
  const rows: number[][] = [];
  for (let start = 0; start < stepCount; start += stepsPerRow) {
    rows.push(
      Array.from(
        { length: Math.min(stepsPerRow, stepCount - start) },
        (_, offset) => start + offset,
      ),
    );
  }
  return rows;
}

export function countDeliveryStopSteps(steps: { key: string }[]): number {
  return steps.filter((step) => step.key.startsWith("stop-")).length;
}

export function shouldUseWormLayout(
  steps: { key: string }[],
  contentWidth: number,
  size: DeliveryRouteProgressRailSize,
): boolean {
  const deliveryStops = countDeliveryStopSteps(steps);
  if (deliveryStops < 3 || contentWidth <= 0) return false;
  return steps.length > computeStepsPerRow(contentWidth, size);
}
