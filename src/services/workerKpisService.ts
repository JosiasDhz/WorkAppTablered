import http from "../api/http-common";

export type WorkerExpedienteKpi = {
  isComplete: boolean;
  requiredUploaded: number;
  requiredTotal: number;
};

export type WorkerImssKpi = {
  isEnrolled: boolean;
  enrolledAt: string | null;
};

export type WorkerAttendanceNextCheckCode =
  | "TRABAJO_ENTRADA"
  | "COMIDA_ENTRADA"
  | "COMIDA_SALIDA"
  | "TRABAJO_SALIDA";

export type WorkerAttendanceKpi = {
  workDayYmd: string;
  warehouseName: string | null;
  nextCheckCode: WorkerAttendanceNextCheckCode | null;
  estimatedArrivalHmm: string | null;
  estimatedLeaveHmm: string | null;
  completedExitAt: string | null;
};

export type WorkerRoleHomeKpiTone = "ok" | "pending" | "neutral";

export type WorkerRoleHomeKpiAction = "inventory" | "routes" | "none";

export type WorkerRoleHomeChartKind =
  | "bars"
  | "columns"
  | "donut"
  | "area"
  | "duoArea"
  | "segments"
  | "grid";

export type WorkerRoleHomeChartItem = {
  label: string;
  value: number;
};

export type WorkerRoleHomeChartLine = {
  label: string;
  stroke: "solid" | "dashed";
  color: string;
  items: WorkerRoleHomeChartItem[];
};

export type WorkerRoleHomePaymentSlice = {
  code: string;
  label: string;
  shortLabel: string;
  value: number;
  percent: number;
};

export type WorkerRoleHomeChartBadge = {
  label: string;
  value: number;
};

export type WorkerRoleHomeChartValueFormat = "count" | "mxn";

export type WorkerRoleHomeChart = {
  kind: WorkerRoleHomeChartKind;
  items: WorkerRoleHomeChartItem[];
  centerLabel?: string;
  lines?: WorkerRoleHomeChartLine[];
  payments?: WorkerRoleHomePaymentSlice[];
  badge?: WorkerRoleHomeChartBadge;
  valueFormat?: WorkerRoleHomeChartValueFormat;
};

export type WorkerRoleHomeKpi = {
  title: string;
  status: string;
  caption: string;
  tone: WorkerRoleHomeKpiTone;
  progress: number;
  percentLabel: string;
  action: WorkerRoleHomeKpiAction;
  chart?: WorkerRoleHomeChart;
};

export type WorkerHomeKpis = {
  expediente: WorkerExpedienteKpi;
  imss: WorkerImssKpi;
  attendance: WorkerAttendanceKpi;
  roleKpi: WorkerRoleHomeKpi | null;
  commission: WorkerCommissionKpi | null;
};

export type WorkerCommissionKpi = {
  programActive: boolean;
  periodKey: string;
  earnedTotal: number;
  title: string;
  caption: string;
  progress: number;
  percentLabel: string;
  goal: {
    label: string;
    current: number;
    target: number;
    remaining: number;
    bonusAmount: number | null;
    met: boolean;
  } | null;
};

export async function getWorkerHomeKpis(): Promise<WorkerHomeKpis> {
  const { data } = await http.get<WorkerHomeKpis>("/worker-kpis/home");
  return data;
}
