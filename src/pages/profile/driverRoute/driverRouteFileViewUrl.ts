import { apiBaseUrl } from "../../../api/http-common";

export function driverRouteFileViewUrl(fileId: string | null | undefined): string | null {
  const id = String(fileId ?? "").trim();
  if (!id || !apiBaseUrl) return null;
  return `${apiBaseUrl}/files/${id}/view`;
}

const DRIVER_ROUTE_SIGNATURE_FILE_PREFIX = "file:";

export function resolveDriverRouteSignatureUri(
  stored: string | null | undefined,
): string | null {
  const value = String(stored ?? "").trim();
  if (!value) return null;
  if (value.startsWith(DRIVER_ROUTE_SIGNATURE_FILE_PREFIX)) {
    return driverRouteFileViewUrl(value.slice(DRIVER_ROUTE_SIGNATURE_FILE_PREFIX.length));
  }
  return value;
}
