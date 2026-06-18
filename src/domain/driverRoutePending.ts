export type DeliveryRouteStatusApi =
  | "GUARDADA"
  | "CONFIRMADA"
  | "LEVANTAMIENTO"
  | "EN_PROCESO"
  | "COMPLETA"
  | "CANCELADA";

export function isPendingDriverRouteStatus(status: string): boolean {
  return status !== "COMPLETA" && status !== "CANCELADA";
}

export function driverRouteStatusLabelEs(status: string): string {
  const map: Record<string, string> = {
    GUARDADA: "Pendiente",
    CONFIRMADA: "Confirmada",
    LEVANTAMIENTO: "Verificación vehículo",
    EN_PROCESO: "En proceso",
    COMPLETA: "Completa",
    CANCELADA: "Cancelada",
  };
  return map[status] ?? status;
}
