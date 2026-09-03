import type { WorkerRoleHomeKpi } from "../../../services/workerKpisService";

export function buildEmptySupervisorRoleHomeKpi(): WorkerRoleHomeKpi {
  return {
    title: "Ventas",
    status: "$0",
    caption: "Sucursal · últimos 30 días",
    tone: "neutral",
    progress: 0,
    percentLabel: "$0",
    action: "none",
    chart: {
      kind: "columns",
      valueFormat: "mxn",
      items: [
        { label: "Efectivo", value: 0 },
        { label: "Depósito", value: 0 },
        { label: "T. débito", value: 0 },
        { label: "T. crédito", value: 0 },
        { label: "Transferencia", value: 0 },
      ],
      payments: [
        {
          code: "EFECTIVO",
          label: "Efectivo",
          shortLabel: "EF",
          value: 0,
          percent: 0,
        },
        {
          code: "DEPOSITO",
          label: "Depósito",
          shortLabel: "DE",
          value: 0,
          percent: 0,
        },
        {
          code: "TARJETA_DE_DEBITO",
          label: "T. débito",
          shortLabel: "TD",
          value: 0,
          percent: 0,
        },
        {
          code: "TARJETA_DE_CREDITO",
          label: "T. crédito",
          shortLabel: "TC",
          value: 0,
          percent: 0,
        },
        {
          code: "TRANSFERENCIA",
          label: "Transferencia",
          shortLabel: "TR",
          value: 0,
          percent: 0,
        },
      ],
    },
  };
}
