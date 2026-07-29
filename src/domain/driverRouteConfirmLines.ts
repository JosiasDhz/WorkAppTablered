import type { DriverIncidentReason, DriverRouteReceiptLinePayload } from "../types/driverIncidents";

export type DriverRouteConfirmLine = {
  id: string;
  rowKind?: string | null;
  transferId?: string | null;
  productName: string;
  saleFolio: string;
  quantity: number;
  deliveryStatus: string;
  warehouseConfirmedAtCdmx?: string | null;
  warehouseConfirmedByWorkerId?: string | null;
  driverConfirmedAtCdmx?: string | null;
  driverConfirmedByWorkerId?: string | null;
  street?: string;
  neighborhood?: string;
  externalNumber?: string;
  city?: string;
};

export function isDriverRouteTransferLine(line: DriverRouteConfirmLine): boolean {
  const kind = String(line.rowKind ?? "").trim().toLowerCase();
  if (kind === "transfer") return true;
  if (kind === "sale_delivery") return false;
  return Boolean(String(line.transferId ?? "").trim());
}

function hasWarehouseAudit(line: DriverRouteConfirmLine): boolean {
  return Boolean(
    String(line.warehouseConfirmedAtCdmx ?? "").trim() &&
      String(line.warehouseConfirmedByWorkerId ?? "").trim(),
  );
}

function hasDriverAudit(line: DriverRouteConfirmLine): boolean {
  return Boolean(
    String(line.driverConfirmedAtCdmx ?? "").trim() &&
      String(line.driverConfirmedByWorkerId ?? "").trim(),
  );
}

export function isDriverRouteLineConfirmable(line: DriverRouteConfirmLine): boolean {
  if (hasDriverAudit(line)) return false;
  if (isDriverRouteTransferLine(line)) {
    return hasWarehouseAudit(line);
  }
  return hasWarehouseAudit(line);
}

export function isDriverRouteLineConfirmed(line: DriverRouteConfirmLine): boolean {
  if (isDriverRouteTransferLine(line)) return hasDriverAudit(line);
  return hasDriverAudit(line);
}

export function flattenDriverRouteConfirmLines(
  destinations: Array<{ records: DriverRouteConfirmLine[] }>,
): DriverRouteConfirmLine[] {
  const out: DriverRouteConfirmLine[] = [];
  for (const dest of destinations) {
    for (const rec of dest.records) out.push(rec);
  }
  return out;
}

export function driverRouteConfirmProgress(lines: DriverRouteConfirmLine[]): {
  confirmedCount: number;
  pendingCount: number;
  totalCount: number;
  allConfirmed: boolean;
} {
  let confirmedCount = 0;
  let pendingCount = 0;
  for (const line of lines) {
    if (isDriverRouteLineConfirmed(line)) confirmedCount += 1;
    else if (isDriverRouteLineConfirmable(line)) pendingCount += 1;
  }
  const totalCount = confirmedCount + pendingCount;
  return {
    confirmedCount,
    pendingCount,
    totalCount,
    allConfirmed: !lines.some(isDriverRouteLineConfirmable),
  };
}

export function driverRouteNeedsDriverReceipt(lines: DriverRouteConfirmLine[]): boolean {
  return lines.some(isDriverRouteLineConfirmable);
}

export function buildDriverRouteConfirmPayload(selected: DriverRouteConfirmLine[]): {
  cartItemDeliveryIds: string[];
  transferIds: string[];
} {
  const cartItemDeliveryIds: string[] = [];
  const transferIds = new Set<string>();
  for (const line of selected) {
    if (isDriverRouteTransferLine(line)) {
      const tid = String(line.transferId ?? line.id).trim();
      if (tid) transferIds.add(tid);
      continue;
    }
    const id = String(line.id).trim();
    if (id) cartItemDeliveryIds.push(id);
  }
  return { cartItemDeliveryIds, transferIds: [...transferIds] };
}

function parseReceiptQty(raw: string): number {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function buildDriverRouteReceiptPayload(
  lines: DriverRouteConfirmLine[],
  qtyByLineId: Record<string, string>,
  damagedByLineId: Record<string, string>,
  commentByLineId: Record<string, string>,
  reasonByLineId: Record<string, DriverIncidentReason | undefined> = {},
): DriverRouteReceiptLinePayload[] {
  return lines.map((line) => {
    const receivedQuantity = parseReceiptQty(qtyByLineId[line.id] ?? "");
    const damagedQuantity = parseReceiptQty(damagedByLineId[line.id] ?? "0");
    const hasShortage = receivedQuantity < line.quantity;
    const hasDamage = damagedQuantity > 0;
    const explicitReason = reasonByLineId[line.id];
    let reasonCode: DriverIncidentReason | undefined = explicitReason;
    if (!reasonCode) {
      if (hasShortage) reasonCode = "faltante_recepcion";
      else if (hasDamage) reasonCode = "danado_recepcion";
    }

    return {
      lineKind: isDriverRouteTransferLine(line) ? "transfer" : "sale_delivery",
      lineId: line.id,
      transferId: line.transferId ?? undefined,
      expectedQuantity: line.quantity,
      receivedQuantity,
      damagedQuantity: hasDamage ? damagedQuantity : undefined,
      reasonCode: hasShortage || hasDamage ? reasonCode : undefined,
      comment: commentByLineId[line.id]?.trim() || undefined,
    };
  });
}

export function allDriverRouteReceiptQtyCaptured(
  lines: DriverRouteConfirmLine[],
  qtyByLineId: Record<string, string>,
): boolean {
  if (lines.length === 0) return false;
  return lines.every((line) => /\d/.test((qtyByLineId[line.id] ?? "").trim()));
}

export function driverRouteReceiptHasDiscrepancy(
  lines: DriverRouteConfirmLine[],
  qtyByLineId: Record<string, string>,
  damagedByLineId: Record<string, string>,
): boolean {
  return lines.some((line) => {
    const received = parseReceiptQty(qtyByLineId[line.id] ?? "");
    const damaged = parseReceiptQty(damagedByLineId[line.id] ?? "0");
    return received < line.quantity || damaged > 0;
  });
}

function isDriverRouteLineInTransit(line: DriverRouteConfirmLine): boolean {
  return (
    String(line.deliveryStatus ?? "").trim().toUpperCase() ===
    "EN_PROCESO_DE_ENVIO"
  );
}

export function firstDriverRouteStopInTransitIndex(
  destinations: Array<{ records: DriverRouteConfirmLine[] }>,
): number {
  for (let i = 0; i < destinations.length; i++) {
    if (destinations[i].records.some(isDriverRouteLineInTransit)) return i;
  }
  return destinations.length > 0 ? destinations.length - 1 : 0;
}

export function buildDriverRouteDeliveredPayload(lines: DriverRouteConfirmLine[]): {
  cartItemDeliveryIds?: string[];
  transferIds?: string[];
} {
  if (lines.length === 0) return {};

  const inTransit = lines.filter(isDriverRouteLineInTransit);
  const source = inTransit.length > 0 ? inTransit : lines;
  const isTransferGroup = source.some(isDriverRouteTransferLine);

  if (isTransferGroup) {
    const transferIds = [
      ...new Set(
        source
          .map((line) => String(line.transferId ?? "").trim())
          .filter(Boolean),
      ),
    ];
    return transferIds.length > 0 ? { transferIds } : {};
  }

  const cartItemDeliveryIds = source
    .map((line) => String(line.id).trim())
    .filter(Boolean);

  return cartItemDeliveryIds.length > 0 ? { cartItemDeliveryIds } : {};
}
