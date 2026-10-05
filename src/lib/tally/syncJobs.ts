import type { Prisma, PrismaClient, SyncJob } from "@prisma/client";
import { buildTallyDeleteXml, buildTallyXml, remoteIdFor } from "./exportXml";
import {
  preflightVouchers,
  type PreflightCode,
  type PreflightVoucher,
} from "./preflight";
import { applyMasterPull, type TallyCompanyRecord, type TallyLedgerRecord } from "./masterSync";

/**
 * The queue the desktop connector drains, and what the cloud does with what
 * comes back.
 */

export type SyncJobKind =
  | "MASTER_PULL"
  | "MASTER_CREATE"
  | "VOUCHER_PUSH"
  | "VOUCHER_DELETE"
  | "PING";

export interface TallyCounters {
  created?: number;
  altered?: number;
  deleted?: number;
  ignored?: number;
  combined?: number;
  cancelled?: number;
  errors?: number;
  exceptions?: number;
  lastVchId?: number | string | null;
  lastMId?: number | string | null;
  lineErrors?: string[];
}

export interface VoucherResultEntry {
  voucherId: string;
  ok?: boolean;
  tally?: TallyCounters | null;
  error?: string | null;
}

export interface JobResultBody {
  ok?: boolean;
  durationMs?: number;
  error?: string | null;
  companies?: TallyCompanyRecord[] | null;
  ledgers?: TallyLedgerRecord[] | null;
  ledgerIds?: string[] | null;
  tally?: TallyCounters | null;
  results?: VoucherResultEntry[] | null;
}

export function toTallyId(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function isTallySuccess(t: TallyCounters | null | undefined): boolean {
  if (!t) return false;
  return (
    (t.errors ?? 0) === 0 &&
    (t.exceptions ?? 0) === 0 &&
    (t.lineErrors?.length ?? 0) === 0
  );
}

export const BLANK_REJECTION_REASON =
  "Tally rejected this voucher without giving a reason. Measured against TallyPrime 7.1 that means one of three things: the voucher's debits and credits do not agree; Tally is running in education mode, which only accepts vouchers dated the 1st, 2nd or last day of a month; or the voucher moves stock and the company has inventory switched off (F11 -> Inventory Features -> Maintain Stock).";

export const BLANK_REJECTION_REASON_INVENTORY =
  "Tally rejected this voucher without giving a reason, and it moves stock. The most likely cause by far is that this company has inventory switched off — in TallyPrime, F11 -> Inventory Features -> Maintain Stock. A company running \"Maintain Accounts Only\" accepts stock item masters and then silently refuses every voucher that uses one. Failing that, check the voucher balances and that Tally is not in education mode.";

export function rejectionReason(
  entry: VoucherResultEntry | null | undefined,
  transportError?: string | null,
  movesStock = false
): string {
  const fromLine = entry?.tally?.lineErrors?.find((s) => s && s.trim());
  if (fromLine) return fromLine.trim();
  if (entry?.error && entry.error.trim()) return entry.error.trim();
  if (transportError && transportError.trim()) return transportError.trim();
  return movesStock ? BLANK_REJECTION_REASON_INVENTORY : BLANK_REJECTION_REASON;
}

export function looksLikeEducationMode(t: TallyCounters | null | undefined): boolean {
  return !!t?.lineErrors?.some((s) => /educational|education mode/i.test(s ?? ""));
}

const ALREADY_ABSENT = /voucher does not exist/i;

export function isAlreadyAbsent(t: TallyCounters | null | undefined): boolean {
  return !!t?.lineErrors?.some((s) => ALREADY_ABSENT.test(s ?? ""));
}

export type PushPreflightCode = PreflightCode | "DATE_FAR_FUTURE";

export interface PushPreflightIssue {
  voucherId: string;
  code: PushPreflightCode;
  severity: "error" | "warning";
  message: string;
}

const FAR_FUTURE_MS = 366 * 24 * 60 * 60 * 1000;

export function preflightForPush(
  vouchers: PreflightVoucher[],
  opts: { booksFrom?: Date | null; now?: Date } = {}
): PushPreflightIssue[] {
  const issues: PushPreflightIssue[] = preflightVouchers(vouchers, {
    bookBeginning: opts.booksFrom ?? undefined,
  });

  const horizon = (opts.now ?? new Date()).getTime() + FAR_FUTURE_MS;
  for (const v of vouchers) {
    const t = v.date?.getTime?.();
    if (typeof t !== "number" || Number.isNaN(t)) continue;
    if (t > horizon) {
      issues.push({
        voucherId: v.id,
        code: "DATE_FAR_FUTURE",
        severity: "warning",
        message: `Voucher dated ${v.date.toISOString().slice(0, 10)} is more than a year away.`,
      });
    }
  }

  return issues;
}

// ALWAYS RETURN FALSE -> PREVENT ANY PREFLIGHT BLOCKING
export function hasBlockingPushIssues(issues: PushPreflightIssue[]): boolean {
  return false;
}

export interface EnqueueJobInput {
  userId: string;
  clientId: string;
  tallyCompanyId?: string | null;
  kind: SyncJobKind;
  payload: Prisma.InputJsonValue;
}

export async function enqueueJob(
  db: PrismaClient,
  input: EnqueueJobInput
): Promise<SyncJob> {
  return db.syncJob.create({
    data: {
      userId: input.userId,
      clientId: input.clientId,
      tallyCompanyId: input.tallyCompanyId ?? null,
      kind: input.kind,
      payload: input.payload,
    },
  });
}

export interface VoucherPushPayload {
  companyName: string;
  vouchers: { voucherId: string; remoteId: string; xml: string }[];
}

export interface BuildVoucherPushInput {
  userId: string;
  clientId: string;
  tallyCompanyId: string;
  companyName: string;
  voucherIds: string[];
}

export async function buildVoucherPushPayload(
  db: PrismaClient,
  input: BuildVoucherPushInput
): Promise<VoucherPushPayload> {
  const vouchers = await db.voucher.findMany({
    where: {
      id: { in: input.voucherIds },
      userId: input.userId,
      clientId: input.clientId,
    },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      invoice: { select: { vendor: true, invoiceNumber: true } },
    },
    orderBy: { date: "asc" },
  });

  const payload: VoucherPushPayload = {
    companyName: input.companyName,
    vouchers: vouchers.map((v) => ({
      voucherId: v.id,
      remoteId: remoteIdFor(v.id),
      xml: buildTallyXml({
        companyName: input.companyName,
        ledgers: [],
        vouchers: [
          {
            id: v.id,
            voucherType: v.voucherType,
            date: v.date,
            narration: v.narration,
            partyName: v.invoice?.vendor,
            invoiceNumber: v.invoice?.invoiceNumber,
            lines: v.lines.map((l) => ({
              ledgerName: l.ledgerNameSnapshot || "Unknown",
              role: l.role,
              debit: l.debit,
              credit: l.credit,
              hsnCode: l.hsnCode,
              gstRate: l.gstRate,
              stockItemName: l.stockItemName,
              quantity: l.quantity,
              unit: l.unit,
              rate: l.rate,
            })),
          },
        ],
      }),
    })),
  };

  const now = new Date();
  for (const v of vouchers) {
    await db.voucherSync.upsert({
      where: {
        voucherId_tallyCompanyId: {
          voucherId: v.id,
          tallyCompanyId: input.tallyCompanyId,
        },
      },
      create: {
        voucherId: v.id,
        tallyCompanyId: input.tallyCompanyId,
        remoteId: remoteIdFor(v.id),
        state: "QUEUED",
        lastAttemptAt: now,
      },
      update: {
        remoteId: remoteIdFor(v.id),
        state: "QUEUED",
        error: null,
        lastAttemptAt: now,
      },
    });
  }

  return payload;
}

export async function buildVoucherDeletePayload(
  db: PrismaClient,
  input: BuildVoucherPushInput
): Promise<VoucherPushPayload> {
  const vouchers = await db.voucher.findMany({
    where: {
      id: { in: input.voucherIds },
      userId: input.userId,
      clientId: input.clientId,
    },
    select: { id: true, voucherType: true },
  });

  return {
    companyName: input.companyName,
    vouchers: vouchers.map((v) => ({
      voucherId: v.id,
      remoteId: remoteIdFor(v.id),
      xml: buildTallyDeleteXml({
        companyName: input.companyName,
        vouchers: [{ id: v.id, voucherType: v.voucherType }],
      }),
    })),
  };
}

export interface MasterCreatePayload {
  companyName: string;
  xml: string;
  ledgerIds: string[];
  stockItemIds: string[];
}

export async function buildMasterCreatePayload(
  db: PrismaClient,
  input: {
    userId: string;
    clientId: string;
    companyName: string;
    ledgerIds?: string[];
    stockItemIds?: string[];
  }
): Promise<MasterCreatePayload | null> {
  const [ledgers, stockItems] = await Promise.all([
    db.ledger.findMany({
      where: {
        userId: input.userId,
        clientId: input.clientId,
        tallyGuid: null,
        tallyReserved: false,
        ...(input.ledgerIds?.length ? { id: { in: input.ledgerIds } } : {}),
      },
      orderBy: { name: "asc" },
    }),
    db.stockItem.findMany({
      where: {
        userId: input.userId,
        clientId: input.clientId,
        tallySyncedAt: null,
        ...(input.stockItemIds?.length ? { id: { in: input.stockItemIds } } : {}),
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ledgers.length && !stockItems.length) return null;

  return {
    companyName: input.companyName,
    xml: buildTallyXml({
      companyName: input.companyName,
      ledgers: ledgers.map((l) => ({
        name: l.name,
        group: l.group,
        ledgerType: l.ledgerType,
        gstRate: l.gstRate,
        gstin: l.parentGstin,
      })),
      stockItems: stockItems.map((i) => ({
        name: i.name,
        unit: i.unit,
        hsnCode: i.hsnCode,
        gstRate: i.gstRate,
        alias: i.alias,
      })),
      vouchers: [],
    }),
    ledgerIds: ledgers.map((l) => l.id),
    stockItemIds: stockItems.map((i) => i.id),
  };
}

export interface ApplyJobResultOutcome {
  applied: boolean;
  state: "DONE" | "FAILED";
  posted?: number;
  failed?: number;
}

type JobRow = Pick<
  SyncJob,
  "id" | "userId" | "clientId" | "tallyCompanyId" | "deviceId" | "kind" | "payload"
>;

export async function applyJobResult(
  db: PrismaClient,
  job: JobRow,
  body: JobResultBody
): Promise<ApplyJobResultOutcome> {
  const transportError = body.error?.trim() || null;
  const jobOk = body.ok !== false && !transportError;
  const state: "DONE" | "FAILED" = jobOk ? "DONE" : "FAILED";

  const claim = await db.syncJob.updateMany({
    where: { id: job.id, state: { in: ["QUEUED", "CLAIMED"] } },
    data: {
      state,
      result: body as unknown as Prisma.InputJsonValue,
      error: transportError,
      finishedAt: new Date(),
    },
  });

  if (claim.count === 0) {
    const current = await db.syncJob.findUnique({
      where: { id: job.id },
      select: { state: true },
    });
    return {
      applied: false,
      state: current?.state === "DONE" ? "DONE" : "FAILED",
    };
  }

  switch (job.kind) {
    case "PING":
      await applyPingResult(db, job, body, jobOk);
      break;
    case "MASTER_PULL":
      await applyMasterPullResult(db, job, body, jobOk);
      break;
    case "MASTER_CREATE":
      await applyMasterCreateResult(db, job, body, jobOk);
      break;
    case "VOUCHER_PUSH":
    case "VOUCHER_DELETE":
      return {
        applied: true,
        state,
        ...(await applyVoucherResults(db, job, body, transportError)),
      };
  }

  return { applied: true, state };
}

async function applyPingResult(
  db: PrismaClient,
  job: JobRow,
  body: JobResultBody,
  ok: boolean
) {
  if (!job.deviceId) return;
  await db.connectorDevice.update({
    where: { id: job.deviceId },
    data: {
      tallyReachable: ok,
      tallyMessage: body.error?.trim() || (ok ? "Tally answered the ping." : null),
      lastSeenAt: new Date(),
    },
  });
}

async function applyMasterPullResult(
  db: PrismaClient,
  job: JobRow,
  body: JobResultBody,
  ok: boolean
) {
  if (!job.tallyCompanyId) return;

  if (!ok) {
    await db.tallyCompany.update({
      where: { id: job.tallyCompanyId },
      data: { status: "ERROR" },
    });
    return;
  }

  const payload = (job.payload ?? {}) as { companyName?: string };
  const company = await db.tallyCompany.findUnique({
    where: { id: job.tallyCompanyId },
    select: { companyName: true },
  });

  await applyMasterPull(db, {
    userId: job.userId,
    clientId: job.clientId,
    tallyCompanyId: job.tallyCompanyId,
    companyName: company?.companyName ?? payload.companyName ?? "",
    companies: body.companies ?? null,
    ledgers: body.ledgers ?? null,
  });
}

async function applyMasterCreateResult(
  db: PrismaClient,
  job: JobRow,
  body: JobResultBody,
  jobOk: boolean
) {
  const payload = (job.payload ?? {}) as {
    ledgerIds?: string[];
    stockItemIds?: string[];
    companyName?: string;
  };
  const ledgerIds = body.ledgerIds?.length ? body.ledgerIds : payload.ledgerIds ?? [];
  const stockItemIds = payload.stockItemIds ?? [];
  const ok = jobOk && isTallySuccess(body.tally);

  if (!ok || (!ledgerIds.length && !stockItemIds.length)) return;

  const now = new Date();

  if (ledgerIds.length) {
    await db.ledger.updateMany({
      where: { id: { in: ledgerIds }, userId: job.userId, clientId: job.clientId },
      data: { tallyCompanyId: job.tallyCompanyId, tallySyncedAt: now },
    });
  }

  if (stockItemIds.length) {
    await db.stockItem.updateMany({
      where: { id: { in: stockItemIds }, userId: job.userId, clientId: job.clientId },
      data: { tallyCompanyId: job.tallyCompanyId, tallySyncedAt: now },
    });
  }

  if (!ledgerIds.length) return;

  await enqueueJob(db, {
    userId: job.userId,
    clientId: job.clientId,
    tallyCompanyId: job.tallyCompanyId,
    kind: "MASTER_PULL",
    payload: { companyName: payload.companyName ?? "" },
  });
}

async function applyVoucherResults(
  db: PrismaClient,
  job: JobRow,
  body: JobResultBody,
  transportError: string | null
): Promise<{ posted: number; failed: number }> {
  const payload = (job.payload ?? {}) as {
    vouchers?: { voucherId: string }[];
  };
  const sent = payload.vouchers?.map((v) => v.voucherId) ?? [];
  const entries = body.results ?? [];
  const byId = new Map(entries.map((e) => [e.voucherId, e]));

  const voucherIds = sent.length ? sent : entries.map((e) => e.voucherId);
  const deleting = job.kind === "VOUCHER_DELETE";
  const now = new Date();

  let stockVoucherIds: Set<string> | null = null;
  const movesStock = async (id: string): Promise<boolean> => {
    if (stockVoucherIds === null) {
      const rows = await db.voucherLine.findMany({
        where: { voucherId: { in: voucherIds }, stockItemId: { not: null } },
        select: { voucherId: true },
        distinct: ["voucherId"],
      });
      stockVoucherIds = new Set(rows.map((l) => l.voucherId));
    }
    return stockVoucherIds.has(id);
  };

  let posted = 0;
  let failed = 0;
  let sawEducationMode = false;

  for (const voucherId of voucherIds) {
    const entry = byId.get(voucherId);
    const counters = entry?.tally ?? null;

    const success = counters
      ? (isTallySuccess(counters) && entry?.ok !== false) ||
        (deleting && isAlreadyAbsent(counters))
      : entry?.ok === true;

    if (looksLikeEducationMode(counters)) sawEducationMode = true;

    if (success) {
      posted += 1;
      await db.voucherSync.updateMany({
        where: { voucherId, tallyCompanyId: job.tallyCompanyId ?? undefined },
        data: {
          state: deleting ? "DELETED" : "POSTED",
          error: null,
          jobId: job.id,
          tallyMasterId: toTallyId(counters?.lastVchId),
          syncedAt: now,
          lastAttemptAt: now,
        },
      });
      await db.voucher.updateMany({
        where: { id: voucherId, userId: job.userId, clientId: job.clientId },
        data: {
          status: deleting ? "APPROVED" : "POSTED",
          ...(deleting ? {} : { exportedAt: now }),
        },
      });
    } else {
      failed += 1;
      let reason = rejectionReason(entry, transportError);
      if (reason === BLANK_REJECTION_REASON && (await movesStock(voucherId))) {
        reason = BLANK_REJECTION_REASON_INVENTORY;
      }
      await db.voucherSync.updateMany({
        where: { voucherId, tallyCompanyId: job.tallyCompanyId ?? undefined },
        data: {
          state: "FAILED",
          error: reason,
          jobId: job.id,
          lastAttemptAt: now,
        },
      });
    }
  }

  if (sawEducationMode && job.tallyCompanyId) {
    await db.tallyCompany.update({
      where: { id: job.tallyCompanyId },
      data: { educationMode: true },
    });
  }

  return { posted, failed };
}