"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Landmark,
  ArrowRight,
  CheckSquare,
  Download,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

const money = (n: number) =>
  `₹${(n || 0).toLocaleString("en-IN")}`;

function trace(event: string, meta?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_TRACE_LOGS === "0") return;

  if (meta) {
    console.log(`[trace][transactions-ui] ${event}`, meta);
    return;
  }

  console.log(`[trace][transactions-ui] ${event}`);
}

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
  if (isDuplicate) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
        Duplicate
      </span>
    );
  }

  if (status === "EXPORTED_DEMO") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/20">
        Exported XML
      </span>
    );
  }

  if (
    status === "SYNCED" ||
    status === "APPROVED" ||
    status === "POSTED"
  ) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        {status === "APPROVED" ? "Approved" : "Synced"}
      </span>
    );
  }

  if (unmapped) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
        Needs ledger
      </span>
    );
  }

  if (confidence != null && confidence < 0.7) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20">
        Low conf.
      </span>
    );
  }

  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
      Ready
    </span>
  );
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

  const filtered = useMemo(() => {
    if (filter === "ready") {
      return vouchers.filter(
        (v) => !v.hasUnmapped && v.status === "DRAFT"
      );
    }

    if (filter === "low") {
      return vouchers.filter(
        (v) =>
          v.hasUnmapped ||
          (v.confidence != null && v.confidence < 0.7)
      );
    }

    return vouchers;
  }, [vouchers, filter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAllReady() {
    const ready = filtered
      .filter(
        (v) => !v.hasUnmapped && v.status === "DRAFT"
      )
      .map((v) => v.id);

    setSelected(new Set(ready));
  }

  async function bulkApprove() {
    if (!selected.size) return;

    const startedAt = performance.now();

    trace("bulk-approve:start", {
      selectedCount: selected.size,
    });

    setBusy(true);

    try {
      await fetch("/api/vouchers/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucherIds: [...selected],
        }),
      });

      trace("bulk-approve:done", {
        selectedCount: selected.size,
        durationMs: Number(
          (performance.now() - startedAt).toFixed(2)
        ),
      });

      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function exportTally(ids?: string[]) {
    const startedAt = performance.now();

    trace("export-tally:start", {
      selectedCount: ids?.length ?? 0,
    });

    setBusy(true);

    try {
      const res = await fetch("/api/export/tally", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          ids?.length ? { voucherIds: ids } : {}
        ),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Export failed");
        return;
      }

      const blob = await res.blob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `tally_export_${new Date()
        .toISOString()
        .slice(0, 10)}.xml`;

      a.click();

      URL.revokeObjectURL(url);

      trace("export-tally:done", {
        selectedCount: ids?.length ?? 0,
        durationMs: Number(
          (performance.now() - startedAt).toFixed(2)
        ),
      });

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-[var(--spx-canvas)] text-[var(--spx-text)] p-6 md:p-10 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--spx-text)]">
            Transactions
          </h1>

          <p className="text-[var(--spx-muted)] text-sm mt-1">
            Map ledgers, approve, and export Tally XML
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllReady}
            className="bg-[var(--spx-input-bg)] border-[var(--spx-border)] text-[var(--spx-text-secondary)] hover:bg-[var(--spx-card-hover)] hover:text-[var(--spx-text)]"
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Select ready
          </Button>

          <Button
            size="sm"
            disabled={!selected.size || busy}
            onClick={bulkApprove}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}

            Approve selected ({selected.size})
          </Button>

          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              exportTally(
                selected.size ? [...selected] : undefined
              )
            }
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Tally XML
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            trace("tab:change", {
              from: tab,
              to: "invoices",
            });

            setTab("invoices");
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
            tab === "invoices"
              ? "bg-white text-black border-white"
              : "bg-[var(--spx-input-bg)] text-[var(--spx-muted)] border-[var(--spx-border)] hover:bg-[var(--spx-card-hover)] hover:text-[var(--spx-text)]"
          }`}
        >
          Invoices ({vouchers.length})
        </button>

        <button
          onClick={() => {
            trace("tab:change", {
              from: tab,
              to: "bank",
            });

            setTab("bank");
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
            tab === "bank"
              ? "bg-white text-black border-white"
              : "bg-[var(--spx-input-bg)] text-[var(--spx-muted)] border-[var(--spx-border)] hover:bg-[var(--spx-card-hover)] hover:text-[var(--spx-text)]"
          }`}
        >
          Bank Statements ({statements.length})
        </button>

        {tab === "invoices" && (
          <>
            {(["all", "ready", "low"] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  trace("filter:change", {
                    from: filter,
                    to: f,
                  });

                  setFilter(f);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                  filter === f
                    ? "bg-gray-300 text-gray-900 border-gray-400"
                    : "bg-[var(--spx-input-bg)] text-[var(--spx-muted)] border-[var(--spx-border)] hover:text-[var(--spx-text)]"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "ready"
                  ? "Ready"
                  : "Needs attention"}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Invoices */}
      {tab === "invoices" ? (
        <div className="border border-[var(--spx-border)] rounded-xl bg-[var(--spx-card)] shadow-xl overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="text-[var(--spx-muted)] bg-[var(--spx-input-bg)] uppercase text-xs border-b border-[var(--spx-border)]">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-zinc-600"
                    >
                      No invoices yet. Upload to create vouchers.
                    </td>
                  </tr>
                )}

                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-[var(--spx-border)] hover:bg-[var(--spx-card-hover)]/70 transition group"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggle(v.id)}
                        disabled={
                          v.status !== "DRAFT" &&
                          v.status !== "APPROVED"
                        }
                        className="rounded border-zinc-700 bg-zinc-900"
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/vouchers/${v.id}`}
                        className="flex items-center gap-2 text-[var(--spx-text)] group-hover:text-[var(--spx-text)]"
                      >
                        <FileText className="h-4 w-4 text-[var(--spx-muted)]" />
                        {v.vendor}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-[var(--spx-muted)]">
                      {v.invoiceNumber}
                    </td>

                    <td className="px-4 py-3 text-[var(--spx-muted)]">
                      {v.type}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-[var(--spx-text)]">
                      {money(v.amount)}
                    </td>

                    <td className="px-4 py-3">
                      <StatusChip
                        status={v.status}
                        unmapped={v.hasUnmapped}
                        isDuplicate={v.isDuplicate}
                        confidence={v.confidence}
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/vouchers/${v.id}`}
                        className="inline-flex items-center gap-1 text-[var(--spx-muted)] hover:text-[var(--spx-text)]"
                      >
                        Map
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      ) : (

        /* Bank Statements */
        <div className="border border-[var(--spx-border)] rounded-xl bg-[var(--spx-card)] shadow-xl overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="text-[var(--spx-muted)] bg-[var(--spx-input-bg)] uppercase text-xs border-b border-[var(--spx-border)]">
                <tr>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3 text-center">
                    Txns
                  </th>
                  <th className="px-4 py-3 text-right">
                    In / Out
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {statements.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-zinc-600"
                    >
                      No bank statements yet. Upload one from
                      the Upload page.
                    </td>
                  </tr>
                )}

                {statements.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--spx-border)] hover:bg-[var(--spx-card-hover)]/70 transition group"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/bank/${s.id}`}
                        className="flex items-center gap-2 text-[var(--spx-text)] hover:text-[var(--spx-text)]"
                      >
                        <Landmark className="h-4 w-4 text-[var(--spx-muted)]" />
                        {s.bankName || "Bank Statement"}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-[var(--spx-muted)] truncate max-w-[160px]">
                      {s.fileName}
                    </td>

                    <td className="px-4 py-3 text-center text-[var(--spx-muted)]">
                      {s.txnCount}
                    </td>

                    <td className="px-4 py-3 text-right text-[var(--spx-muted)] whitespace-nowrap">
                      <span className="text-emerald-400">
                        {money(s.totalIn)}
                      </span>{" "}
                      /{" "}
                      <span className="text-red-400">
                        {money(s.totalOut)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusChip
                        status={s.status}
                        unmapped={s.unmapped > 0}
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/bank/${s.id}`}
                        className="inline-flex items-center gap-1 text-[var(--spx-muted)] hover:text-[var(--spx-text)]"
                      >
                        Map
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}
    </div>
  );
}