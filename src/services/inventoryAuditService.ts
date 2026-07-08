import http from "../api/http-common";

const prefix = "/inventory-audit";

export type InventoryAuditStatus =
  | "pending"
  | "in_progress"
  | "paused"
  | "pending_review"
  | "pending_responsibility"
  | "finalized"
  | "completed"
  | "submitted";

export interface AuditInventoryLocation {
  id: string;
  code: string;
  name: string;
}

export function auditFamilyDisplayLabel(family: {
  displayLabel?: string;
  inventoryLocation?: AuditInventoryLocation | null;
  brand?: { name: string } | null;
  departament?: { name: string };
}): string {
  if (family.displayLabel) return family.displayLabel;
  if (family.inventoryLocation) {
    const dept = family.departament?.name ?? "—";
    return `${dept} · ${family.inventoryLocation.name} (${family.inventoryLocation.code})`;
  }
  if (family.brand?.name) {
    return `${family.departament?.name ?? "—"} · ${family.brand.name}`;
  }
  return family.departament?.name ?? "—";
}

export interface MyInventoryAuditFamily {
  id: string;
  status: string;
  departament?: { id: string; name: string };
  brand?: { id: string; name: string } | null;
  inventoryLocation?: AuditInventoryLocation | null;
  displayLabel?: string;
}

export interface MyInventoryAudit {
  id: string;
  status: InventoryAuditStatus;
  scheduledStartDate: string;
  scheduledEndDate: string;
  workerStartedAt?: string | null;
  workerFinishedAt?: string | null;
  totalProducts: number;
  countedProducts: number;
  createdAt: string;
  comments?: string | null;
  warehouse?: { id: string; name: string } | null;
  worker?: {
    id: string;
    user?: {
      id: string;
      name?: string;
      lastName?: string;
      secondLastName?: string | null;
    };
  };
  createdBy?: {
    id: string;
    name?: string;
    lastName?: string;
  } | null;
  families?: MyInventoryAuditFamily[];
}

export interface MyAuditsResponse {
  data: MyInventoryAudit[];
  total: number;
  limit: number;
  offset: number;
}

export async function getMyAudits(params: {
  limit?: number;
  offset?: number;
}): Promise<MyAuditsResponse> {
  const { limit = 10, offset = 0 } = params;
  const search = new URLSearchParams();
  search.set("limit", String(limit));
  search.set("offset", String(offset));
  const res = await http.get(`${prefix}/my-audits?${search.toString()}`);
  return res.data;
}

export interface AuditDetailFamily {
  id: string;
  status: string;
  totalProducts: number;
  countedProducts: number;
  departament?: { id: string; name: string };
  brand?: { id: string; name: string } | null;
  inventoryLocation?: AuditInventoryLocation | null;
  displayLabel?: string;
}

export interface MyAuditDetail extends Omit<MyInventoryAudit, "families"> {
  families: AuditDetailFamily[];
}

export async function getMyAuditSummary(auditId: string): Promise<MyAuditDetail> {
  const res = await http.get(`${prefix}/${auditId}/summary`);
  return res.data;
}

export async function startMyAudit(auditId: string): Promise<MyAuditDetail> {
  const res = await http.post(`${prefix}/${auditId}/start`);
  return res.data;
}

export interface AuditProductLine {
  id: string;
  systemStock: number | null;
  counted: number | null;
  difference: number | null;
  notes: string | null;
  product: { id: string; sku: string; name: string };
}

export interface FamilyProductsPageResponse {
  family: AuditDetailFamily;
  audit: { id: string; status: string };
  data: AuditProductLine[];
  total: number;
  limit: number;
  offset: number;
}

export async function getFamilyAuditProducts(
  auditId: string,
  familyId: string,
  params: { limit?: number; offset?: number; search?: string },
): Promise<FamilyProductsPageResponse> {
  const { limit = 15, offset = 0, search: searchText } = params;
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  const trimmed = searchText?.trim();
  if (trimmed) qs.set("search", trimmed);
  const res = await http.get(
    `${prefix}/${auditId}/families/${familyId}/products?${qs.toString()}`,
  );
  return res.data;
}

export async function patchFamilyAuditCounts(
  auditId: string,
  familyId: string,
  body: { lines: { id: string; counted: number }[]; completeFamily?: boolean },
): Promise<{ family: AuditDetailFamily; audit: { id: string; status: string } }> {
  const res = await http.patch(
    `${prefix}/${auditId}/families/${familyId}/counts`,
    body,
  );
  return res.data;
}

export interface CostReportProductLine {
  productId: string;
  sku: string;
  name: string;
  systemStock: number;
  counted: number | null;
  difference: number | null;
  unitCost: number;
  warehouseValue: number;
  valueImpact: number;
}

export interface FamilyCostReport {
  familyId: string;
  departament: { id: string; name: string };
  brand?: { id: string; name: string } | null;
  inventoryLocation?: AuditInventoryLocation | null;
  displayLabel?: string;
  status: string;
  totalProducts: number;
  countedProducts: number;
  productsWithLoss: number;
  productsWithSurplus: number;
  productsExact: number;
  lossUnits: number;
  surplusUnits: number;
  lossValue: number;
  surplusValue: number;
  netValue: number;
  products: CostReportProductLine[];
}

export interface AuditCostReport {
  auditId: string;
  status: string;
  totalLoss: number;
  totalSurplus: number;
  netValue: number;
  families: FamilyCostReport[];
}

export async function getAuditCostReport(auditId: string): Promise<AuditCostReport> {
  const res = await http.get(`${prefix}/${auditId}/cost-report`);
  return res.data;
}

export interface MyLossDocumentAudit {
  id: string;
  status: string;
  warehouse: { id: string; name: string } | null;
  scheduledStartDate: string;
  scheduledEndDate: string;
}

export interface MyLossDocumentFamily {
  id: string;
  departament: { id: string; name: string };
  brand?: { id: string; name: string } | null;
  inventoryLocation?: AuditInventoryLocation | null;
  displayLabel?: string;
}

export interface MyLossDocumentItem {
  allocationId: string;
  audit: MyLossDocumentAudit;
  family: MyLossDocumentFamily;
  percentage: number;
  amount: number;
  generateContract: boolean;
  generatePaymentForm: boolean;
  contractDocument: string | null;
  paymentFormDocument: string | null;
  contractSignatureText: string | null;
  paymentFormSignatureText: string | null;
  contractDocumentText: string | null;
  paymentFormDocumentText: string | null;
}

export interface MyLossDocumentsResponse {
  data: MyLossDocumentItem[];
}

export async function getMyLossDocuments(): Promise<MyLossDocumentsResponse> {
  const res = await http.get(`${prefix}/my-loss-documents`);
  return res.data;
}

export async function getMyLossDocumentById(
  allocationId: string,
): Promise<MyLossDocumentItem> {
  const res = await http.get(`${prefix}/my-loss-documents/${allocationId}`);
  return res.data;
}

export async function patchMyLossDocumentSignatures(
  allocationId: string,
  body: { contractSignatureText?: string; paymentFormSignatureText?: string },
): Promise<MyLossDocumentItem> {
  const res = await http.patch(
    `${prefix}/my-loss-documents/${allocationId}/signatures`,
    body,
  );
  return res.data;
}

export function getMyLossDocumentPdfUrl(
  allocationId: string,
  doc: "contract" | "delivery",
) {
  return `${prefix}/my-loss-documents/${allocationId}/pdf?doc=${doc}`;
}
