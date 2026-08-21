import http from "../api/http-common";

export type MyCommissionLineDto = {
  id: string;
  kind: string;
  periodKey: string;
  sourceKey: string;
  saleId: string | null;
  deliveryId: string | null;
  branchId: string | null;
  baseAmount: number;
  ratePercent: number;
  amount: number;
  status: string;
  concept: string | null;
  notes: string | null;
  accruedAt: string | null;
};

export type CommissionGoalProgressDto = {
  kind: "SHIPPING" | "EARNINGS";
  label: string;
  unit: "mxn";
  current: number;
  target: number;
  progress: number;
  remaining: number;
  bonusAmount: number | null;
  met: boolean;
};

export type MyCommissionsDto = {
  sellerId: string;
  sellerCode: string;
  workerName: string;
  workerRole: string | null;
  periodKey: string;
  programActive: boolean;
  goal: CommissionGoalProgressDto | null;
  commissionTier: {
    code: string;
    name: string;
    ratePercent: number;
  };
  maquilaCommissionMode: string | null;
  settings: {
    driverDeliveryRatePercent: number;
    driverShippingGoalBonus: number;
    motorcycleShippingGoalBonus: number;
    camionetaShippingGoalBonus?: number;
    camionShippingGoalBonus?: number;
    driverShippingGoalAmount?: number;
    motorcycleShippingGoalAmount?: number;
    camionetaShippingGoalAmount?: number;
    camionShippingGoalAmount?: number;
    maquilaRatePercent: number;
    maquilaGoalBonus?: number;
  };
  totals: {
    total: number;
    byKind: Record<string, number>;
  };
  fixedMaquilaBonuses?: Array<{
    id: string;
    concept: string;
    amount: number;
    frequency: string;
  }>;
  lines: MyCommissionLineDto[];
};

export const COMMISSION_KIND_LABELS: Record<string, string> = {
  SALE_SELLER: "Ventas",
  DELIVERY_DRIVER: "Entregas",
  SHIPPING_GOAL: "Meta envíos",
  MAQUILA_PERCENT: "Maquila %",
  MAQUILA_FIXED: "Maquila fija",
  MAQUILA_GOAL: "Meta maquila",
  ADJUSTMENT: "Ajuste",
};

export async function fetchMyCommissions(periodKey?: string) {
  const { data } = await http.get<MyCommissionsDto>("/commissions/me", {
    params: periodKey ? { periodKey } : undefined,
  });
  return data;
}

export function currentCommissionPeriodKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftCommissionPeriodKey(periodKey: string, deltaMonths: number) {
  const [yRaw, mRaw] = periodKey.split("-");
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!y || !m) return periodKey;
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return currentCommissionPeriodKey(d);
}

export function formatCommissionPeriodLabel(periodKey: string) {
  const [yRaw, mRaw] = periodKey.split("-");
  const y = Number(yRaw);
  const m = Number(mRaw);
  if (!y || !m) return periodKey;
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
