export type PointsMovementKind = "earn" | "redeem" | "adjust";

export type PointsMovement = {
  id: string;
  reference: string;
  concept: string;
  branch: string;
  kind: string;
  points: number;
  dateLabel: string;
  range: string;
};

export type PointsBalance = {
  total: number;
  expiresLabel: string;
};

const KIND_LABELS: Record<PointsMovementKind, string> = {
  earn: "Abono",
  redeem: "Canje",
  adjust: "Ajuste",
};

export function describeKind(kind: string): string {
  return KIND_LABELS[kind as PointsMovementKind] ?? "Movimiento";
}

export type PointsLedgerRow = PointsMovement & {
  balance: number;
};

export function buildLedger(
  movements: PointsMovement[],
  total: number,
): PointsLedgerRow[] {
  let running = total;
  return movements.map((movement) => {
    const row = { ...movement, balance: running };
    running -= movement.points;
    return row;
  });
}

export function formatPoints(value: number): string {
  return value.toLocaleString("es-MX");
}

export function formatSignedPoints(value: number): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatPoints(Math.abs(value))}`;
}
