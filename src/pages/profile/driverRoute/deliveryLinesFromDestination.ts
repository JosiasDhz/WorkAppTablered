import type { DriverRouteAssignmentDemoDestination } from "../driverDemo/driverRouteAssignmentDemo.types";

export type DeliveryLineView = {
  recordId: string;
  productName: string;
  saleFolio: string;
  expectedQty: number;
};

export type DeliveryPaymentView = {
  status: "PENDING" | "PAID";
  amountToCollectMxn: number;
};

export function buildDeliveryLinesFromDestination(
  destination: DriverRouteAssignmentDemoDestination,
): DeliveryLineView[] {
  return destination.records.map((rec) => ({
    recordId: rec.id,
    productName: rec.productName,
    saleFolio: rec.saleFolio,
    expectedQty: rec.quantity,
  }));
}

export function buildDeliveryPaymentFromDestination(
  destination: DriverRouteAssignmentDemoDestination,
): DeliveryPaymentView | null {
  const payment = destination.payment;
  if (!payment) return null;
  if (payment.status === "PAID") {
    return { status: "PAID", amountToCollectMxn: 0 };
  }
  if (payment.status === "PENDING" && payment.amountToCollectMxn > 0) {
    return {
      status: "PENDING",
      amountToCollectMxn: payment.amountToCollectMxn,
    };
  }
  return null;
}

export function isDeliveryPaymentRequired(payment: DeliveryPaymentView | null): boolean {
  return payment?.status === "PENDING" && payment.amountToCollectMxn > 0;
}

export function parseRouteQty(raw: string): number {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function parseMoneyMxn(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function formatMoneyMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export function emptyRouteQtyMap(recordIds: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const id of recordIds) {
    o[id] = "";
  }
  return o;
}

export function allDeliveryQuantitiesMatched(
  lines: DeliveryLineView[],
  deliveredByRecordId: Record<string, string>,
): boolean {
  if (lines.length === 0) return false;
  return lines.every((line) => {
    const raw = (deliveredByRecordId[line.recordId] ?? "").trim();
    if (!/\d/.test(raw)) return false;
    return parseRouteQty(raw) === line.expectedQty;
  });
}

export function isDeliveryPaymentComplete(
  payment: DeliveryPaymentView | null,
  amountReceivedRaw: string,
): boolean {
  if (!isDeliveryPaymentRequired(payment)) return true;
  const raw = amountReceivedRaw.trim();
  if (!/[\d]/.test(raw)) return false;
  return parseMoneyMxn(raw) + 0.001 >= payment!.amountToCollectMxn;
}

export function deliveryPaymentChangeMxn(
  payment: DeliveryPaymentView | null,
  amountReceivedRaw: string,
): number | null {
  if (!isDeliveryPaymentRequired(payment)) return null;
  const received = parseMoneyMxn(amountReceivedRaw);
  const due = payment!.amountToCollectMxn;
  if (received + 0.001 < due) return null;
  const change = Math.round((received - due) * 100) / 100;
  return change > 0.001 ? change : 0;
}

export function isDeliveryPaymentUnderpaid(
  payment: DeliveryPaymentView | null,
  amountReceivedRaw: string,
): boolean {
  if (!isDeliveryPaymentRequired(payment)) return false;
  const raw = amountReceivedRaw.trim();
  if (!/[\d]/.test(raw)) return false;
  return parseMoneyMxn(raw) + 0.001 < payment!.amountToCollectMxn;
}
