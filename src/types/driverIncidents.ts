export type DriverIncidentReason =
  | "faltante_recepcion"
  | "danado_recepcion"
  | "danado_transito";

export type DriverIncidentPhase = "recepcion" | "en_ruta";

export type DriverRouteReceiptLinePayload = {
  lineKind: "transfer" | "sale_delivery";
  lineId: string;
  transferId?: string;
  expectedQuantity: number;
  receivedQuantity: number;
  damagedQuantity?: number;
  reasonCode?: DriverIncidentReason;
  comment?: string;
  evidenceFileIds?: string[];
};

export type ConfirmDriverRouteReceiptPayload = {
  workerCode: string;
  lines: DriverRouteReceiptLinePayload[];
};

export type CreateDriverIncidentPayload = {
  deliveryRouteId: string;
  reason: DriverIncidentReason;
  phase: DriverIncidentPhase;
  deliveryRouteDestinationId?: string;
  cartItemDeliveryId?: string;
  transferId?: string;
  productName?: string;
  productSku?: string;
  expectedQuantity: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  comment?: string;
  workerCode: string;
  evidenceFileIds?: string[];
};
