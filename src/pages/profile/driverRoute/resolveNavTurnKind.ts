export type NavTurnKind =
  | "left"
  | "right"
  | "slight-left"
  | "slight-right"
  | "straight"
  | "uturn"
  | "merge"
  | "roundabout-left"
  | "roundabout-right"
  | "unknown";

export function resolveNavTurnKind(
  maneuver: string | null | undefined,
  instructionEs: string,
): NavTurnKind {
  const m = (maneuver ?? "").trim().toLowerCase();
  if (m) {
    if (m.includes("uturn")) return "uturn";
    if (m.includes("roundabout")) return m.endsWith("left") ? "roundabout-left" : "roundabout-right";
    if (m === "merge") return "merge";
    if (m === "straight") return "straight";
    if (m.includes("left")) return m.includes("slight") ? "slight-left" : "left";
    if (m.includes("right")) return m.includes("slight") ? "slight-right" : "right";
  }
  const t = instructionEs.toLowerCase();
  if (t.includes("media vuelta") || t.includes("invierte el sentido"))
    return "uturn";
  if (t.includes("rotonda") || t.includes("glorieta")) {
    if (t.includes("izquierda") || t.includes("primera salida") || t.includes("segunda salida"))
      return "roundabout-left";
    if (t.includes("derecha")) return "roundabout-right";
  }
  if (t.includes("izquierda")) return "left";
  if (t.includes("derecha")) return "right";
  if (t.includes("recto") || t.includes("mantente") || t.includes("sigue recto")) return "straight";
  if (t.includes("incorpórate") || t.includes("incorporate")) return "merge";
  return "unknown";
}
