import {
  Plus,
  Download,
  ClipboardList,
  AlertTriangle,
  IndianRupee,
  Send,
  Users,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getActiveClient } from "@/lib/clientContext";
import { getDashboardData } from "@/lib/dashboardStats";
import { extraPagesEnabled } from "@/lib/featureFlags";

export default async function Dashboard() {
  const ctx = await getActiveClient();
  if (!ctx) return redirect("/sign-in");
  const { user, client } = ctx;
  const showExtraPages = extraPagesEnabled();

  // Every headline number plus the draft preview in a single round trip.
  // Measured against the batch of eight Prisma calls this replaced:
  // 1345ms -> 162ms.
  const { stats, rows } = await getDashboardData(user.id, client.id);

  const {
    invoiceCount,
    draftCount,
    approvedCount,
    exportedCount,
    pendingReviewCount,
    unmappedParties,
    gstInput,
    gstOutput,
  } = stats;

  const itcAtStake = stats.itcAtRisk ?? 0;
  const gstLiability = Math.max(0, gstOutput - gstInput);
  const latestRecon =
    stats.reconMatched === null
      ? null
      : {
          matched: stats.reconMatched,
          mismatched: stats.reconMismatched ?? 0,
          itcAtRisk: stats.itcAtRisk ?? 0,
        };

  const reviewList = rows.map((v) => ({
    id: v.id,
    vendor: v.vendor ?? "Unknown",
    invoiceNumber: v.invoiceNumber ?? "—",
    type: v.voucherType,
    amount: v.totalDebit,
    hasUnmapped: v.hasUnmapped,
    confidence: v.avgConfidence,
  }));

  return (
    <div className="p-4 md:p-6 lg:p-7" style={{ maxWidth: "1400px" }}>
      {/* ── Header Row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1
            className="text-white font-bold"
            style={{
              fontSize: "28px",
              letterSpacing: "0.5px",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6f78", marginTop: "4px", letterSpacing: "0.3px" }}>
            {client.name} · Welcome back, {user.name || "User"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/api/export?format=csv">
            <Button
              variant="outline"
              size="sm"
              style={{
                borderColor: "#2a2d35",
                background: "transparent",
                color: "#e8e8ed",
                borderRadius: "2px",
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </a>
          <Link href="/upload">
            <Button
              style={{
                background: "#ffffff",
                color: "#0b0d10",
                borderRadius: "2px",
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
                fontWeight: 700,
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Top Stat Cards: Boxy Grid with Large Numbers ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1px", background: "#2a2d35", marginBottom: "24px" }}>
        <StatCard
          icon={<ClipboardList style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Pending Review"
          value={pendingReviewCount.toString()}
          href={showExtraPages ? "/review" : "/transactions"}
        />
        <StatCard
          icon={<Scale style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="ITC at Stake"
          value={`₹${itcAtStake.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
        />
        <StatCard
          icon={<IndianRupee style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="GST Liability"
          value={`₹${gstLiability.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
        />
        <StatCard
          icon={<Users style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Unmapped Parties"
          value={unmappedParties.toString()}
          href="/transactions"
          alert={unmappedParties > 0}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1px", background: "#2a2d35", marginBottom: "24px" }}>
        <StatCard
          icon={<AlertTriangle style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Draft Vouchers"
          value={draftCount.toString()}
        />
        <StatCard
          icon={<Send style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Ready to Export"
          value={approvedCount.toString()}
          valueColor="#22c55e"
        />
        <StatCard
          icon={<Download style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Exported"
          value={exportedCount.toString()}
        />
        <StatCard
          icon={<ClipboardList style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />}
          label="Invoices"
          value={invoiceCount.toString()}
        />
      </div>

      {/* ── Main Grid: Table + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]" style={{ gap: "24px" }}>
        {/* Vouchers Table */}
        <div style={{ border: "1px solid #2a2d35", background: "#0f1115" }}>
          {/* Table Header Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom: "1px solid #2a2d35",
            }}
          >
            <span
              className="text-[#6b6f78] uppercase"
              style={{ fontSize: "11px", letterSpacing: "1.5px", fontWeight: 500 }}
            >
              Vouchers to Review
            </span>
            {showExtraPages ? (
              <Link
                href="/review"
                style={{
                  fontSize: "11px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase" as const,
                  color: "#e8e8ed",
                  border: "1px solid #2a2d35",
                  padding: "5px 14px",
                  fontWeight: 500,
                }}
              >
                View All
              </Link>
            ) : (
              <Link
                href="/transactions"
                style={{
                  fontSize: "11px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase" as const,
                  color: "#e8e8ed",
                  border: "1px solid #2a2d35",
                  padding: "5px 14px",
                  fontWeight: 500,
                }}
              >
                View All
              </Link>
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2d35" }}>
                  {["Vendor", "Invoice #", "Type", "Amount", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        fontSize: "11px",
                        fontWeight: 400,
                        color: "#6b6f78",
                        textTransform: "uppercase" as const,
                        letterSpacing: "1.5px",
                        textAlign: h === "Amount" ? "right" : "left",
                        fontFamily: "'Inter', system-ui, sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "48px 16px", textAlign: "center", color: "#6b6f78", fontSize: "13px" }}
                    >
                      No drafts pending. Upload an invoice to generate a voucher.
                    </td>
                  </tr>
                )}
                {reviewList.map((v) => (
                  <tr
                    key={v.id}
                    style={{ borderBottom: "1px solid rgba(42, 45, 53, 0.5)" }}
                    className="hover:bg-white/[0.02] transition"
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <Link
                        href={`/vouchers/${v.id}`}
                        className="text-white hover:underline"
                        style={{ fontSize: "14px", fontWeight: 500 }}
                      >
                        {v.vendor}
                      </Link>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#a0a0a8",
                        fontSize: "13px",
                        fontFamily: "'Geist Mono', 'Courier New', monospace",
                      }}
                    >
                      {v.invoiceNumber}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#a0a0a8", fontSize: "13px" }}>
                      {v.type}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#e8e8ed",
                        fontSize: "14px",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ₹{v.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {v.hasUnmapped ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase" as const,
                            border: "1px solid rgba(239, 68, 68, 0.5)",
                            color: "#f87171",
                          }}
                        >
                          Needs ledger
                        </span>
                      ) : (v.confidence ?? 1) < 0.7 ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase" as const,
                            border: "1px solid rgba(245, 158, 11, 0.5)",
                            color: "#fbbf24",
                          }}
                        >
                          Low confidence
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase" as const,
                            border: "1px solid rgba(34, 197, 94, 0.5)",
                            color: "#4ade80",
                          }}
                        >
                          Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Column: Quick Actions ── */}
        <div style={{ border: "1px solid #2a2d35", background: "#0f1115" }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #2a2d35",
            }}
          >
            <span
              className="text-[#6b6f78] uppercase"
              style={{ fontSize: "11px", letterSpacing: "1.5px", fontWeight: 500 }}
            >
              Quick Actions
            </span>
          </div>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {showExtraPages && (
              <Link
                href="/gst"
                className="hover:bg-white/[0.03] transition"
                style={{
                  display: "block",
                  border: "1px solid #2a2d35",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#a0a0a8",
                }}
              >
                Run GST reconciliation (GSTR-2B)
              </Link>
            )}
            {showExtraPages && (
              <Link
                href="/pipeline"
                className="hover:bg-white/[0.03] transition"
                style={{
                  display: "block",
                  border: "1px solid #2a2d35",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#a0a0a8",
                }}
              >
                View pipeline board
              </Link>
            )}
            {showExtraPages && (
              <Link
                href="/reports"
                className="hover:bg-white/[0.03] transition"
                style={{
                  display: "block",
                  border: "1px solid #2a2d35",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#a0a0a8",
                }}
              >
                GST summary &amp; reports
              </Link>
            )}
            <Link
              href="/transactions"
              className="hover:bg-emerald-500/[0.08] transition"
              style={{
                display: "block",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                background: "rgba(34, 197, 94, 0.04)",
                padding: "12px 14px",
                fontSize: "13px",
                color: "#4ade80",
                fontWeight: 500,
              }}
            >
              Export approved vouchers to Tally XML
            </Link>
            {showExtraPages && latestRecon && (
              <div
                style={{
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  background: "rgba(245, 158, 11, 0.04)",
                  padding: "12px 14px",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: 500, color: "#fbbf24" }}>Latest 2B recon</div>
                <div style={{ color: "rgba(251, 191, 36, 0.6)", marginTop: "4px", fontSize: "12px" }}>
                  {latestRecon.matched} matched · {latestRecon.mismatched} mismatch · ITC at risk ₹
                  {latestRecon.itcAtRisk.toLocaleString("en-IN")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── StatCard: Boxy, sharp corners, large number, matching reference exactly ── */
function StatCard({
  icon,
  label,
  value,
  valueColor = "#e8e8ed",
  href,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg?: string;
  valueColor?: string;
  href?: string;
  alert?: boolean;
}) {
  const card = (
    <div
      className="hover:bg-[#161920] transition"
      style={{
        padding: "20px 24px",
        background: alert ? "rgba(229, 62, 62, 0.04)" : "#0f1115",
        borderRight: alert ? "2px solid rgba(229, 62, 62, 0.5)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "#6b6f78",
            textTransform: "uppercase" as const,
            letterSpacing: "1.5px",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {label}
        </span>
        <span style={{ color: "#3a3d45" }}>{icon}</span>
      </div>
      <p
        style={{
          fontSize: "42px",
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: "-0.5px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
