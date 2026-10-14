import type {
  AuditStockMovementKey,
  AuditStockMovements,
} from "../../../services/inventoryAuditService";

type MovementCopy = { one: string; many: string; present: boolean };

const MOVEMENT_COPY: Record<AuditStockMovementKey, MovementCopy> = {
  soldPendingDelivery: { one: "vendida por entregar", many: "vendidas por entregar", present: true },
  transferPendingSend: { one: "en traspaso por enviar", many: "en traspaso por enviar", present: true },
  transferArrivedPendingReception: {
    one: "llegó por traspaso sin recibir",
    many: "llegaron por traspaso sin recibir",
    present: true,
  },
  saleReturnPendingEntry: { one: "devuelta por cliente", many: "devueltas por cliente", present: true },
  reserved: { one: "reservada en venta", many: "reservadas en venta", present: true },
  unpaidSale: { one: "vendida sin pagar", many: "vendidas sin pagar", present: true },
  layaway: { one: "apartada", many: "apartadas", present: true },
  saleTransfer: { one: "traspaso para venta", many: "traspaso para venta", present: true },
  warranty: { one: "en garantía", many: "en garantía", present: true },
  exhibition: { one: "en exhibición", many: "en exhibición", present: true },
  inRoute: { one: "en ruta al cliente", many: "en ruta al cliente", present: false },
  transferInTransit: { one: "en traspaso a otro almacén", many: "en traspaso a otro almacén", present: false },
  outPendingDeduction: { one: "entregada a cliente o maquila", many: "entregadas a cliente o maquila", present: false },
  warrantyWithSupplier: { one: "con proveedor por garantía", many: "con proveedor por garantía", present: false },
};

export type DescribedMovements = { present: string[]; away: string[] };

export function describeStockMovements(
  movements: AuditStockMovements | null | undefined,
): DescribedMovements {
  const present: string[] = [];
  const away: string[] = [];
  for (const [key, qty] of Object.entries(movements ?? {})) {
    const copy = MOVEMENT_COPY[key as AuditStockMovementKey];
    if (!copy || !qty || qty <= 0) continue;
    const text = `${qty} ${qty === 1 ? copy.one : copy.many}`;
    (copy.present ? present : away).push(text);
  }
  return { present, away };
}
