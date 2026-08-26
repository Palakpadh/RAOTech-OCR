"use client";

import type {
  ExcelDocType,
  ItemMode,
  LayoutDetection,
  RowIssue,
  SheetMapping,
  TemplateMatch,
  CellValue,
} from "@/lib/excel/types";

/**
 * The browser's whole view of spreadsheet ingestion.
 *
 * Mirrors `src/components/tallyClient.ts`: one module owning the request
 * shapes, so the wizard is only ever concerned with what to draw.
 */

export interface UploadResponse {
  upload: { id: string; fileName: string; sheetName: string | null; totalRows: number };
  sheets: { name: string; rowCount: number; columnCount: number }[];
  headers: string[];
  headerRowIndex: number;
  droppedRows: number;
  totalRows: number;
  maxRows: number;
  layout: LayoutDetection;
  suggestedMapping: SheetMapping;
  templates: TemplateMatch[];
  preview: CellValue[][];
}

export interface MappingResponse {
  status: "MAPPING" | "READY";
  committableCount: number;
  totalRows: number;
  blockingCount: number;
  warningCount: number;
  issues: RowIssue[];
  missingParties: string[];
  preview: {
    row: number;
    invoice: {
      invoiceNumber: string | null;
      date: string;
      vendor: string | null;
      vendorGstin: string | null;
      subtotal: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    } | null;
    issues: RowIssue[];
    partyLedgerId: string | null;
    partyState: string;
  }[];
}

export interface CommitResponse {
  done: boolean;
  committed: number;
  skipped: number;
  remaining: number;
  failures: { row: number; message: string }[];
  message: string;
}

async function asJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return body as T;
}

export async function uploadSheet(
  file: File,
  docType: ExcelDocType,
  itemMode: ItemMode,
  sheetName?: string
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("docType", docType);
  form.append("itemMode", itemMode);
  if (sheetName) form.append("sheetName", sheetName);

  return asJson<UploadResponse>(
    await fetch("/api/excel/upload", { method: "POST", body: form })
  );
}

export async function previewMapping(
  uploadId: string,
  mapping: SheetMapping
): Promise<MappingResponse> {
  return asJson<MappingResponse>(
    await fetch(`/api/excel/uploads/${uploadId}/mapping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapping }),
    })
  );
}

/**
 * Commit, following the continuation the server hands back.
 *
 * A large sheet is committed in time-boxed batches so no single request runs
 * past its budget; the server reports how far it got and we call again. The
 * caller gets progress rather than a spinner that might be stuck.
 */
export async function commitUpload(
  uploadId: string,
  onProgress?: (committed: number, remaining: number) => void
): Promise<CommitResponse> {
  for (;;) {
    const res = await asJson<CommitResponse>(
      await fetch(`/api/excel/uploads/${uploadId}/commit`, { method: "POST" })
    );
    onProgress?.(res.committed, res.remaining);
    if (res.done) return res;
  }
}

export async function saveTemplate(input: {
  name: string;
  headers: string[];
  mapping: SheetMapping;
  uploadId?: string;
}): Promise<void> {
  await asJson(
    await fetch("/api/excel/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export const DOC_TYPE_LABELS: Record<ExcelDocType, string> = {
  PURCHASE: "Purchase",
  PURCHASE_RETURN: "Purchase Return",
  SALE: "Sales",
  SALE_RETURN: "Sales Return",
  JOURNAL: "Journal",
};

/** Fields the wizard offers in stage 1, in the order an accountant reads them. */
export const FIELD_ORDER: {
  key: keyof SheetMapping["fields"];
  label: string;
  required: boolean | "WITH_ITEM" | "JOURNAL";
}[] = [
  { key: "invoiceNumber", label: "Invoice / Bill No.", required: true },
  { key: "date", label: "Date", required: true },
  { key: "partyName", label: "Party name", required: true },
  { key: "partyGstin", label: "Party GSTIN", required: false },
  { key: "taxable", label: "Taxable value", required: true },
  { key: "total", label: "Invoice total", required: false },
  { key: "discount", label: "Discount", required: false },
  { key: "roundOff", label: "Round off", required: false },
  { key: "narration", label: "Narration", required: false },
  { key: "itemName", label: "Item name", required: "WITH_ITEM" },
  { key: "quantity", label: "Quantity", required: "WITH_ITEM" },
  { key: "rate", label: "Rate", required: "WITH_ITEM" },
  { key: "amount", label: "Amount", required: false },
  { key: "hsnCode", label: "HSN code", required: false },
  { key: "ledgerName", label: "Ledger name", required: "JOURNAL" },
  { key: "debit", label: "Debit", required: "JOURNAL" },
  { key: "credit", label: "Credit", required: "JOURNAL" },
];
