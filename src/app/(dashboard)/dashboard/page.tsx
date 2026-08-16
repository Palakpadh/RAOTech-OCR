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
import { prisma } from "@/lib/prisma";
import { getActiveClient } from "@/lib/clientContext";
import { extraPagesEnabled } from "@/lib/featureFlags";

export default async function Dashboard() {
  const ctx = await getActiveClient();
  if (!ctx) return redirect("/sign-in");
  const { user, client } = ctx;
  const showExtraPages = extraPagesEnabled();

  const scope = { userId: user.id, clientId: client.id };

  // These used to be two unbounded findMany calls that pulled every invoice and
  // every voucher (with their lines) across the wire, only to count them and
  // slice off the first 20. Counting and summing in Postgres keeps the payload
  // flat as the workspace grows.
  const [
    invoiceCount,
    statusCounts,
    pendingReviewCount,
    latestRecon,
    unmappedParties,
    gstInputAgg,
    gstOutputAgg,
    draftPreview,
  ] = await Promise.all([
    prisma.invoice.count({ where: scope }),
    prisma.voucher.groupBy({
      by: ["status"],
      where: scope,
      _count: true,
    }),
    prisma.voucher.count({
      where: {
        ...scope,
        status: "DRAFT",
        OR: [{ lines: { some: { ledgerId: null } } }, { avgConfidence: { lt: 0.7 } }],
      },
    }),
    prisma.gst2bUpload.findFirst({
      where: scope,
      orderBy: { createdAt: "desc" },
    }),
    prisma.voucherLine.count({
      where: {
        ledgerId: null,
        role: "PARTY",
        voucher: { ...scope, status: "DRAFT" },
      },
    }),
    prisma.invoice.aggregate({
      _sum: { taxAmount: true },
      where: { voucher: { ...scope, voucherType: "PURCHASE" } },
    }),
    prisma.invoice.aggregate({
      _sum: { taxAmount: true },
      where: { voucher: { ...scope, voucherType: "SALE" } },
    }),
    prisma.voucher.findMany({
      where: { ...scope, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        voucherType: true,
        totalDebit: true,
        avgConfidence: true,
        invoice: { select: { vendor: true, invoiceNumber: true } },
        lines: { select: { ledgerId: true } },
      },
    }),
  ]);

  const countFor = (...statuses: string[]) =>
    statusCounts
      .filter((s) => statuses.includes(s.status))
      .reduce((sum, s) => sum + s._count, 0);

  const draftCount = countFor("DRAFT");
  const approvedCount = countFor("APPROVED");
  const exportedCount = countFor("EXPORTED_DEMO", "POSTED");
  const gstInput = gstInputAgg._sum.taxAmount ?? 0;
  const gstOutput = gstOutputAgg._sum.taxAmount ?? 0;
  const itcAtStake = latestRecon?.itcAtRisk ?? 0;
  const gstLiability = Math.max(0, gstOutput - gstInput);

  const reviewList = draftPreview.map((v) => ({
    id: v.id,
    vendor: v.invoice?.vendor ?? "Unknown",
    invoiceNumber: v.invoice?.invoiceNumber ?? "—",
    type: v.voucherType,
    amount: v.totalDebit,
    hasUnmapped: v.lines.some((l) => l.ledgerId === null),
    confidence: v.avgConfidence,
  }));

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {client.name} · Welcome back, {user.name || "User"}
          </p>
        </div>
        <div className="flex gap-3">
          <a href="/api/export?format=csv">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </a>
          <Link href="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-yellow-600" />}
          label="Pending Review"
          value={pendingReviewCount.toString()}
          bg="bg-yellow-50"
          href={showExtraPages ? "/review" : "/transactions"}
        />
        <StatCard
          icon={<Scale className="h-5 w-5 text-orange-600" />}
          label="ITC at Stake"
          value={`₹${itcAtStake.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          bg="bg-orange-50"
          href={showExtraPages ? "/gst" : undefined}
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5 text-purple-600" />}
          label="GST Liability (est.)"
          value={`₹${gstLiability.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-red-600" />}
          label="Unmapped Parties"
          value={unmappedParties.toString()}
          bg="bg-red-50"
          href="/transactions"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="Draft Vouchers"
          value={draftCount.toString()}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<Send className="h-5 w-5 text-emerald-600" />}
          label="Ready to Export"
          value={approvedCount.toString()}
          bg="bg-emerald-50"
          valueColor="text-emerald-600"
        />
        <StatCard
          icon={<Download className="h-5 w-5 text-sky-600" />}
          label="Exported"
          value={exportedCount.toString()}
          bg="bg-sky-50"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
          label="Invoices"
          value={invoiceCount.toString()}
          bg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-semibold">Vouchers to Review</h3>
            {showExtraPages ? (
              <Link href="/review" className="text-xs text-blue-600 hover:underline">
                Open review queue
              </Link>
            ) : (
              <Link href="/transactions" className="text-xs text-blue-600 hover:underline">
                Open transactions
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      No drafts pending. Upload an invoice to generate a voucher.
                    </td>
                  </tr>
                )}
                {reviewList.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/vouchers/${v.id}`} className="text-blue-600 hover:underline">
                        {v.vendor}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{v.type}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{v.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {v.hasUnmapped ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          Needs ledger
                        </span>
                      ) : (v.confidence ?? 1) < 0.7 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                          Low confidence
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
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

        <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
          <h3 className="font-semibold">Quick actions</h3>
          {showExtraPages && (
            <Link href="/gst" className="block rounded-lg border p-3 hover:bg-gray-50 text-sm">
              Run GST reconciliation (GSTR-2B)
            </Link>
          )}
          {showExtraPages && (
            <Link href="/pipeline" className="block rounded-lg border p-3 hover:bg-gray-50 text-sm">
              View pipeline board
            </Link>
          )}
          {showExtraPages && (
            <Link href="/reports" className="block rounded-lg border p-3 hover:bg-gray-50 text-sm">
              GST summary &amp; reports
            </Link>
          )}
          <Link
            href="/transactions"
            className="block rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 font-medium"
          >
            Export approved vouchers to Tally XML
          </Link>
          {showExtraPages && latestRecon && (
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-sm">
              <div className="font-medium text-orange-800">Latest 2B recon</div>
              <div className="text-orange-700 mt-1">
                {latestRecon.matched} matched · {latestRecon.mismatched} mismatch · ITC at risk ₹
                {latestRecon.itcAtRisk.toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
  valueColor = "text-gray-900",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  valueColor?: string;
  href?: string;
}) {
  const card = (
    <div className="p-5 border rounded-xl bg-white shadow-sm hover:shadow transition">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

