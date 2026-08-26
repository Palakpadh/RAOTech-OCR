import { prisma } from "@/lib/prisma";
import { normalizeInvoice } from "./normalize";
import { classifyVoucher } from "./classifyVoucher";
import { resolveLedgersForInvoice } from "./resolveLedger";
import { buildVoucher } from "./buildVoucher";
import { seedLedgersForUser } from "./seedLedgers";
import type { NormalizedInvoice, VoucherType } from "./types";

/**
 * Build and persist a DRAFT voucher for an invoice (single workspace).
 *
 * - Seeds the standard chart of accounts on first use.
 * - Idempotent for drafts: an existing DRAFT voucher is rebuilt; an APPROVED /
 *   POSTED voucher is left untouched and returned as-is.
 * - Best-effort caller contract: throws on hard errors; callers that wrap the
 *   invoice-save flow should catch so OCR save never fails because of this.
 *
 * `opts.normalized` exists for callers that did not come from OCR. This
 * function normally re-derives the invoice from `extractedData`, which is the
 * OCR backend's snake_case payload — a spreadsheet row has no such payload and
 * has already produced a `NormalizedInvoice` of its own. Without this the
 * Excel path silently normalised `{}` into an all-zero invoice and built a
 * voucher with no lines at all, which Tally then rejected with a blank reason.
 * Passing the invoice in keeps one accounting path rather than encoding it back
 * into snake_case purely to parse it out again.
 */
export async function createDraftVoucherForInvoice(
  userId: string,
  invoiceId: string,
  opts: {
    voucherTypeOverride?: VoucherType;
    partyLedgerId?: string | null;
    forceNewParty?: boolean;
    clientId?: string;
    /** Skip re-deriving from `extractedData`; use this invoice as authoritative. */
    normalized?: NormalizedInvoice;
    /**
     * Ledgers the caller has already chosen, overriding automatic resolution.
     *
     * The spreadsheet wizard makes the user nominate a purchase/sales account
     * and the GST ledgers — the competitor makes those mandatory too — and
     * without this that choice was resolved away and silently ignored. The
     * symptom is specific: tax lines come out with no ledger and Tally answers
     * `Ledger 'Unknown' does not exist!`, naming a ledger nobody chose.
     */
    ledgerOverrides?: {
      itemLedgerId?: string | null;
      cgstLedgerId?: string | null;
      sgstLedgerId?: string | null;
      igstLedgerId?: string | null;
      roundOffLedgerId?: string | null;
      discountLedgerId?: string | null;
    };
  } = {}
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { voucher: true },
  });
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.voucher && invoice.voucher.status !== "DRAFT") {
    return invoice.voucher;
  }

  const clientId = opts.clientId || invoice.clientId;
  if (!clientId) throw new Error("clientId is required");

  await seedLedgersForUser(prisma, userId, clientId);

  const extracted = (invoice.extractedData as Record<string, unknown>) ?? {};
  const inv = opts.normalized ?? normalizeInvoice(extracted);
  const voucherType =
    opts.voucherTypeOverride ?? classifyVoucher(inv, invoice.documentType);

  const resolved = await resolveLedgersForInvoice(prisma, userId, inv, voucherType, clientId);

  if (opts.forceNewParty) {
    resolved.party = null;
  } else if (opts.partyLedgerId) {
    const chosen = await prisma.ledger.findFirst({
      where: { id: opts.partyLedgerId, userId, clientId },
      select: { id: true, name: true },
    });
    if (chosen) {
      resolved.party = { id: chosen.id, name: chosen.name, confidence: 1, via: "MANUAL" };
    }
  }

  // Apply the caller's explicit ledger choices over whatever resolution found.
  // Names are looked up in one query so the voucher line carries a snapshot;
  // `buildVoucher` writes `ledgerNameSnapshot` from it, and a null snapshot is
  // exactly what becomes "Unknown" in the Tally envelope.
  const overrides = opts.ledgerOverrides;
  if (overrides) {
    const wanted = [
      overrides.itemLedgerId,
      overrides.cgstLedgerId,
      overrides.sgstLedgerId,
      overrides.igstLedgerId,
      overrides.roundOffLedgerId,
      overrides.discountLedgerId,
    ].filter((id): id is string => !!id);

    if (wanted.length) {
      const rows = await prisma.ledger.findMany({
        where: { id: { in: wanted }, userId, clientId },
        select: { id: true, name: true },
      });
      const byId = new Map(rows.map((r) => [r.id, r.name]));

      const set = (
        idKey: "cgstLedgerId" | "sgstLedgerId" | "igstLedgerId" | "roundOffLedgerId",
        nameKey: "cgstLedgerName" | "sgstLedgerName" | "igstLedgerName" | "roundOffLedgerName",
        id: string | null | undefined
      ) => {
        if (!id || !byId.has(id)) return;
        resolved[idKey] = id;
        resolved[nameKey] = byId.get(id)!;
      };

      set("cgstLedgerId", "cgstLedgerName", overrides.cgstLedgerId);
      set("sgstLedgerId", "sgstLedgerName", overrides.sgstLedgerId);
      set("igstLedgerId", "igstLedgerName", overrides.igstLedgerId);
      set("roundOffLedgerId", "roundOffLedgerName", overrides.roundOffLedgerId);

      if (overrides.discountLedgerId && byId.has(overrides.discountLedgerId)) {
        resolved.discountLedgerId = overrides.discountLedgerId;
        resolved.discountLedgerName = byId.get(overrides.discountLedgerId)!;
      }

      // The purchase/sales account. With no line items `buildVoucher` uses
      // `itemLedgers[0]` for the single synthesised net line, so seed one.
      if (overrides.itemLedgerId && byId.has(overrides.itemLedgerId)) {
        const ref = {
          id: overrides.itemLedgerId,
          name: byId.get(overrides.itemLedgerId)!,
          confidence: 1,
          via: "MANUAL" as const,
        };
        if (!resolved.itemLedgers.length) {
          resolved.itemLedgers = [
            {
              item: { name: "", qty: 0, rate: 0, price: 0, hsnCode: null, gstRate: null },
              ledger: ref,
            },
          ];
        } else {
          resolved.itemLedgers = resolved.itemLedgers.map((l) =>
            l.ledger ? l : { ...l, ledger: ref }
          );
        }
      }
    }
  }

  const draft = buildVoucher(inv, resolved, voucherType, {
    narration: invoice.invoiceNumber ? `Inv ${invoice.invoiceNumber}` : null,
  });

  const confidences = draft.lines.map((l) => l.confidence).filter((c): c is number => c != null);
  const avgConfidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;

  const voucherFields = {
    voucherType: draft.voucherType,
    status: "DRAFT" as const,
    date: draft.date,
    narration: draft.narration,
    totalDebit: draft.totalDebit,
    totalCredit: draft.totalCredit,
    roundOff: draft.roundOff,
    avgConfidence,
  };
  const lineCreate = draft.lines.map((l) => ({
    ledgerId: l.ledgerId,
    ledgerNameSnapshot: l.ledgerNameSnapshot,
    role: l.role,
    debit: l.debit,
    credit: l.credit,
    confidence: l.confidence,
    mappedVia: l.mappedVia,
    hsnCode: l.hsnCode,
    gstRate: l.gstRate,
    sortOrder: l.sortOrder,
  }));

  const result = await prisma.$transaction(async (tx) => {
    if (invoice.voucher) {
      // Rebuild IN PLACE — keep the same voucher id so its URL and any
      // in-flight client references (e.g. after a voucher-type switch) stay
      // valid. Recreating with a new id orphaned the review page → 404.
      await tx.voucherLine.deleteMany({ where: { voucherId: invoice.voucher.id } });
      return tx.voucher.update({
        where: { id: invoice.voucher.id },
        data: { ...voucherFields, lines: { create: lineCreate } },
        include: { lines: { orderBy: { sortOrder: "asc" } } },
      });
    }
    return tx.voucher.create({
      data: {
        userId,
        clientId,
        invoiceId: invoice.id,
        ...voucherFields,
        lines: { create: lineCreate },
      },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return result;
}
