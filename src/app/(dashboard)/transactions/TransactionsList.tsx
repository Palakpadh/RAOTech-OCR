"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Landmark,
  ArrowRight,
  CheckSquare,
  Download,
  Loader2,
  AlertTriangle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TallySyncBadge } from "@/components/TallySyncBadge";
import { TallySyncOverlay } from "@/components/TallySyncOverlay";
import { useTallyPush, useVoucherSyncs } from "@/components/tallyClient";

/** Mirrors PreflightIssue in src/lib/tally/preflight.ts. */
interface ExportIssue {
  voucherId: string;
  code: string;
  severity: "error" | "warning";
  message: string;
}

interface VoucherRow {
  id: string;
  vendor: string;
  invoiceNumber: string;
  type: string;
  amount: number;
  status: string;
  hasUnmapped: boolean;
  isDuplicate?: boolean;
  confidence?: number | null;
}
interface BankRow {
  id: string;
  fileName: string;
  bankName: string | null;
  status: string;
  txnCount: number;
  unmapped: number;
  totalIn: number;
  totalOut: number;
}

const money = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

function StatusChip({
  status,
  unmapped,
  isDuplicate,
  confidence,
}: {
  status: string;
  unmapped: boolean;
  isDuplicate?: boolean;
  confidence?: number | null;
}) {
  if (isDuplicate)
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Duplicate</span>;
  if (status === "EXPORTED_DEMO")
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">Exported XML</span>;
  if (status === "SYNCED" || status === "APPROVED" || status === "POSTED")
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      {status === "APPROVED" ? "Approved" : "Synced"}
    </span>;
  if (unmapped)
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Needs ledger</span>;
  if (confidence != null && confidence < 0.7)
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Low conf.</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Ready</span>;
}

export default function TransactionsList({
  vouchers,
  statements,
}: {
  vouchers: VoucherRow[];
  statements: BankRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"invoices" | "bank">("invoices");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "ready" | "low">("all");
  const [hideSynced, setHideSynced] = useState(false);
  const [failedOnly, setFailedOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const { toast } = useToast();
  // Populated when the server refuses an export because Tally would reject it.
  const [blocked, setBlocked] = useState<ExportIssue[] | null>(null);

  const voucherIds = useMemo(() => vouchers.map((v) => v.id), [vouchers]);
  const { syncs, refresh: refreshSyncs } = useVoucherSyncs(voucherIds);

  // A push settling changes both the sync rows and Voucher.status, so refresh
  // the server component too rather than letting the table drift from Tally.
  const onSettled = useCallback(() => {
    void refreshSyncs();
    router.refresh();
  }, [refreshSyncs, router]);
  const push = useTallyPush({ onSettled });

  const labels = useMemo(
    () => Object.fromEntries(vouchers.map((v) => [v.id, `${v.vendor} · ${v.invoiceNumber}`])),
    [vouchers]
  );

  const filtered = useMemo(() => {
    let rows = vouchers;
    if (filter === "ready") rows = rows.filter((v) => !v.hasUnmapped && v.status === "DRAFT");
    if (filter === "low")
      rows = rows.filter((v) => v.hasUnmapped || (v.confidence != null && v.confidence < 0.7));
    if (hideSynced)
      rows = rows.filter((v) => syncs[v.id]?.state !== "POSTED" && v.status !== "POSTED");
    if (failedOnly) rows = rows.filter((v) => syncs[v.id]?.state === "FAILED");
    return rows;
  }, [vouchers, filter, hideSynced, failedOnly, syncs]);

  /** Only a voucher Tally has actually accepted can be removed from its books. */
  const deletable = useMemo(
    () => [...selected].filter((id) => syncs[id]?.state === "POSTED"),
    [selected, syncs]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllReady() {
    const ready = filtered.filter((v) => !v.hasUnmapped && v.status === "DRAFT").map((v) => v.id);
    setSelected(new Set(ready));
  }

  async function bulkApprove() {
    if (!selected.size) return;
    setBusy(true);
    try {
      await fetch("/api/vouchers/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherIds: [...selected] }),
      });
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function exportTally(ids?: string[]) {
    setBusy(true);
    setBlocked(null);
    try {
      const res = await fetch("/api/export/tally", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids?.length ? { voucherIds: ids } : {}),
      });

      // 422 means preflight caught something Tally would reject. Show exactly
      // what and on which voucher, rather than a generic failure — the whole
      // point is to save the user a trip through Tally.imp.
      if (res.status === 422) {
        const body = await res.json().catch(() => ({}));
        const issues: ExportIssue[] = [
          ...(body.issues ?? []),
          ...(body.warnings ?? []),
        ];
        setBlocked(issues.length ? issues : [
          { voucherId: "", code: "UNKNOWN", severity: "error", message: body.error || "Export blocked." },
        ]);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Export failed", "error");
        return;
      }

      const warnings = Number(res.headers.get("X-Export-Warnings") || 0);
      const count = Number(res.headers.get("X-Export-Count") || 0);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tally_export_${new Date().toISOString().slice(0, 10)}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast(
        warnings
          ? `Exported ${count} voucher(s) with ${warnings} warning(s) — check ledger names in Tally.`
          : `Exported ${count} voucher(s). Import the file in Tally.`,
        warnings ? "info" : "success"
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">Map ledgers, approve, and post to Tally</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={toggleAllReady}>
            <CheckSquare className="mr-2 h-4 w-4" /> Select ready
          </Button>
          <Button size="sm" variant="outline" disabled={!selected.size || busy} onClick={bulkApprove}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve selected ({selected.size})
          </Button>
          {deletable.length > 0 && (
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(deletable)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete From Tally ({deletable.length})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => exportTally(selected.size ? [...selected] : undefined)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export XML
          </Button>
          <Button
            size="sm"
            className="bg-[#0b6b3a] hover:bg-[#0a5c32]"
            disabled={!selected.size || push.state.phase !== "idle"}
            onClick={() => push.start([...selected])}
          >
            <Send className="mr-2 h-4 w-4" />
            Push to Tally ({selected.size})
          </Button>
        </div>
      </div>

      {blocked && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Tally would reject this export
                </h3>
                <p className="mt-0.5 text-sm text-red-800">
                  Fixed here, these never become an error buried in Tally.imp. Errors block
                  the export; warnings do not.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setBlocked(null)}
              className="rounded p-1 text-red-500 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {blocked.map((issue, i) => {
              const v = vouchers.find((row) => row.id === issue.voucherId);
              return (
                <li
                  key={`${issue.voucherId}-${issue.code}-${i}`}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      issue.severity === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {issue.severity}
                  </span>
                  {v ? (
                    <Link
                      href={`/vouchers/${v.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {v.vendor} · {v.invoiceNumber}
                    </Link>
                  ) : (
                    issue.voucherId && (
                      <span className="font-medium text-gray-700">
                        {issue.voucherId.slice(0, 8)}
                      </span>
                    )
                  )}
                  <span className="text-gray-700">{issue.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("invoices")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "invoices" ? "bg-gray-900 text-white" : "bg-white border text-gray-600"}`}
        >
          Invoices ({vouchers.length})
        </button>
        <button
          onClick={() => setTab("bank")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "bank" ? "bg-gray-900 text-white" : "bg-white border text-gray-600"}`}
        >
          Bank Statements ({statements.length})
        </button>
        {tab === "invoices" && (
          <>
            {(["all", "ready", "low"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium ${filter === f ? "bg-blue-600 text-white" : "bg-white border text-gray-500"}`}
              >
                {f === "all" ? "All" : f === "ready" ? "Ready" : "Needs attention"}
              </button>
            ))}
            <button
              onClick={() => setHideSynced((v) => !v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${hideSynced ? "bg-emerald-600 text-white" : "bg-white border text-gray-500"}`}
            >
              Hide Tally Synced
            </button>
            <button
              onClick={() => setFailedOnly((v) => !v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${failedOnly ? "bg-red-600 text-white" : "bg-white border text-gray-500"}`}
            >
              Failed Records Only
            </button>
          </>
        )}
      </div>

      {tab === "invoices" ? (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tally</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      {failedOnly || hideSynced
                        ? "No rows match these filters."
                        : "No invoices yet. Upload to create vouchers."}
                    </td>
                  </tr>
                )}
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50 transition group">
                    <td className="px-4 py-3">
                      {/* Posted rows stay selectable: removing one from Tally's
                          books is done from this table too. */}
                      <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/vouchers/${v.id}`}
                        className="flex items-center gap-2 text-blue-600 group-hover:text-blue-800"
                      >
                        <FileText className="h-4 w-4" /> {v.vendor}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{v.type}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(v.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        status={v.status}
                        unmapped={v.hasUnmapped}
                        isDuplicate={v.isDuplicate}
                        confidence={v.confidence}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TallySyncBadge sync={syncs[v.id]} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/vouchers/${v.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Map <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3 text-center">Txns</th>
                  <th className="px-4 py-3 text-right">In / Out</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {statements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No bank statements yet. Upload one from the Upload page.
                    </td>
                  </tr>
                )}
                {statements.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50 transition group">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/bank/${s.id}`}
                        className="flex items-center gap-2 text-amber-700 group-hover:text-amber-900"
                      >
                        <Landmark className="h-4 w-4" /> {s.bankName || "Bank Statement"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]">{s.fileName}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.txnCount}</td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                      <span className="text-green-600">{money(s.totalIn)}</span> /{" "}
                      <span className="text-red-600">{money(s.totalOut)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={s.status} unmapped={s.unmapped > 0} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/bank/${s.id}`}
                        className="inline-flex items-center gap-1 text-amber-700 hover:underline"
                      >
                        Map <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TallySyncOverlay
        push={push}
        labels={labels}
        onClose={() => {
          setSelected(new Set());
          void refreshSyncs();
        }}
      />

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.length} voucher${confirmDelete.length === 1 ? "" : "s"} from Tally?`}
          body={
            <>
              This removes {confirmDelete.length === 1 ? "the voucher" : "these vouchers"} from
              Tally&apos;s books on the connected machine — not just from this workspace. Tally
              resolves the deletion by the id we posted with, so it removes exactly what we sent.
              It cannot be undone from here; the voucher would have to be pushed again.
            </>
          }
          confirmLabel="Delete from Tally"
          onConfirm={() => {
            const ids = confirmDelete;
            setConfirmDelete(null);
            void push.remove(ids);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
