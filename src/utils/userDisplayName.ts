function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildUserDisplayNameFull(user: any, seller: any): string {
  const fromUser = [user?.name, user?.lastName, user?.secondLastName]
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromUser) return fromUser;

  const sellerName = cleanText(seller?.name) || cleanText(seller?.user?.name);
  if (sellerName) {
    const extra = [seller?.user?.lastName, seller?.user?.secondLastName]
      .map(cleanText)
      .filter(Boolean);
    return [sellerName, ...extra].join(" ").trim();
  }

  return "Usuario";
}

export function buildUserFirstName(user: any, seller: any): string {
  const full = buildUserDisplayNameFull(user, seller);
  return full.split(" ")[0] || full;
}

function cleanCode(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return cleanText(value);
}

export function resolveWorkerCode(user: any, seller: any): string {
  return cleanCode(seller?.code) || cleanCode(user?.code) || "—";
}
