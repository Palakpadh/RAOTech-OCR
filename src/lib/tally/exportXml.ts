/**
 * Generate TallyPrime-compatible XML for ledger masters + vouchers.
 * Import via Gateway of Tally → Import Data → XML.
 */

type ExportLedger = {
  name: string;
  group: string;
  /** Drives the GST duty-head and bill-wise decisions. */
  ledgerType?: string | null;
  /** Combined GST rate (e.g. 18 for an 18% purchase ledger). */
  gstRate?: number | null;
  gstin?: string | null;
};

type ExportLine = {
  ledgerName: string;
  /** PARTY lines carry the bill reference; ITEM lines carry HSN. */
  role?: string | null;
  debit: number;
  credit: number;
  hsnCode?: string | null;
  gstRate?: number | null;
};

type ExportVoucher = {
  /** Our voucher UUID. Becomes REMOTEID, which is how Tally recognises a
   *  re-import as the same voucher and alters it instead of duplicating it. */
  id: string;
  voucherType: string;
  date: Date;
  narration?: string | null;
  partyName?: string | null;
  invoiceNumber?: string | null;
  lines: ExportLine[];
};

const TALLY_GROUP: Record<string, string> = {
  SUNDRY_CREDITORS: "Sundry Creditors",
  SUNDRY_DEBTORS: "Sundry Debtors",
  DUTIES_AND_TAXES: "Duties & Taxes",
  PURCHASE_ACCOUNTS: "Purchase Accounts",
  SALES_ACCOUNTS: "Sales Accounts",
  DIRECT_EXPENSES: "Direct Expenses",
  INDIRECT_EXPENSES: "Indirect Expenses",
  INDIRECT_INCOME: "Indirect Incomes",
  BANK_ACCOUNTS: "Bank Accounts",
  CASH_IN_HAND: "Cash-in-Hand",
  CURRENT_ASSETS: "Current Assets",
  CURRENT_LIABILITIES: "Current Liabilities",
  FIXED_ASSETS: "Fixed Assets",
};

const TALLY_VOUCHER: Record<string, string> = {
  PURCHASE: "Purchase",
  SALE: "Sales",
  JOURNAL: "Journal",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
  PAYMENT: "Payment",
  RECEIPT: "Receipt",
  CONTRA: "Contra",
};

/** Groups where Tally should track invoice-level outstandings. */
const BILLWISE_GROUPS = new Set(["SUNDRY_CREDITORS", "SUNDRY_DEBTORS"]);

/** Ledger types whose GST rate belongs on the master. */
const RATED_LEDGER_TYPES = new Set(["PURCHASE", "SALE", "EXPENSE", "INCOME"]);

/** Tally's duty-head names, inferred from the tax ledger's own name. */
function gstDutyHead(ledgerName: string): string | null {
  const n = ledgerName.toUpperCase();
  if (n.startsWith("CGST")) return "Central Tax";
  if (n.startsWith("SGST")) return "State Tax";
  if (n.startsWith("IGST")) return "Integrated Tax";
  if (n.startsWith("CESS")) return "Cess";
  return null;
}

/**
 * Tally matches ledgers and company names by exact string. Leading/trailing
 * whitespace is one of the most-cited import failures ("Extra space in the name
 * of ledgers or company name"), and it is invisible in the UI, so every
 * identifier is trimmed on the way out.
 *
 * Internal runs of whitespace are deliberately left alone — collapsing them
 * would rewrite a name that may legitimately exist that way in Tally. Preflight
 * warns about those instead.
 */
function name(s: string) {
  return s.trim();
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tallyDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Trim a rate to the shortest exact form Tally accepts: 9, 2.5, 0.125. */
function rateStr(n: number) {
  return String(Number(n.toFixed(3)));
}

/**
 * GST configuration on the ledger master.
 *
 * For accounting-only vouchers (no inventory) Tally derives a voucher's GST
 * treatment from its ledgers rather than from the voucher lines, so the rate
 * has to live here. A combined 18% splits 9/9 across Central and State Tax;
 * the integrated head carries the full rate and Tally applies whichever is
 * relevant based on the party's state.
 */
function gstDetailsXml(l: ExportLedger, applicableFrom: string) {
  const rate = l.gstRate;
  if (rate == null || !RATED_LEDGER_TYPES.has(String(l.ledgerType))) return "";
  const half = rateStr(rate / 2);
  const full = rateStr(rate);
  return `
          <GSTDETAILS.LIST>
            <APPLICABLEFROM>${applicableFrom}</APPLICABLEFROM>
            <TAXABILITY>Taxable</TAXABILITY>
            <GSTRATEDUTYHEAD.LIST>
              <GSTRATEDUTYHEAD>Central Tax</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${half}</GSTRATE>
            </GSTRATEDUTYHEAD.LIST>
            <GSTRATEDUTYHEAD.LIST>
              <GSTRATEDUTYHEAD>State Tax</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${half}</GSTRATE>
            </GSTRATEDUTYHEAD.LIST>
            <GSTRATEDUTYHEAD.LIST>
              <GSTRATEDUTYHEAD>Integrated Tax</GSTRATEDUTYHEAD>
              <GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE>
              <GSTRATE>${full}</GSTRATE>
            </GSTRATEDUTYHEAD.LIST>
          </GSTDETAILS.LIST>`;
}

function ledgerXml(
  l: ExportLedger,
  opts: { gstApplicableFrom: string; includeGstDetails: boolean }
) {
  const ledgerName = name(l.name);
  const parent = TALLY_GROUP[l.group] || l.group.replaceAll("_", " ");

  // Party ledgers need bill-wise on, or Tally cannot age an outstanding
  // against the invoice it came from.
  const billWise = BILLWISE_GROUPS.has(l.group);

  const dutyHead = l.group === "DUTIES_AND_TAXES" ? gstDutyHead(ledgerName) : null;
  const dutyBlock = dutyHead
    ? `
          <TAXTYPE>GST</TAXTYPE>
          <GSTDUTYHEAD>${dutyHead}</GSTDUTYHEAD>`
    : "";
  const gstBlock = opts.includeGstDetails
    ? gstDetailsXml(l, opts.gstApplicableFrom)
    : "";

  return `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="${esc(ledgerName)}" ACTION="Create">
          <NAME.LIST>
            <NAME>${esc(ledgerName)}</NAME>
          </NAME.LIST>
          <PARENT>${esc(parent)}</PARENT>
          ${l.gstin ? `<PARTYGSTIN>${esc(l.gstin)}</PARTYGSTIN>` : ""}
          <ISBILLWISEON>${billWise ? "Yes" : "No"}</ISBILLWISEON>${dutyBlock}${gstBlock}
        </LEDGER>
      </TALLYMESSAGE>`;
}

/**
 * The REMOTEID we stamp on every voucher, and Tally's idempotency key.
 *
 * Verified against a live instance: re-importing with the same REMOTEID ALTERs
 * the existing voucher, a different one CREATEs a duplicate, and
 * ACTION="Delete" resolves by it. Everything that needs to name a voucher in
 * Tally — re-posting, deleting, VoucherSync.remoteId — must go through here,
 * because a prefix applied in one place and not another silently creates
 * duplicates instead of updates.
 */
export function remoteIdFor(voucherId: string): string {
  return `RAO-${voucherId}`;
}

function voucherXml(v: ExportVoucher, opts: { includeGstDetails: boolean }) {
  const vtype = TALLY_VOUCHER[v.voucherType] || "Journal";

  // Bill reference for party allocations. Falls back to the stable voucher id
  // so a party balance is never left unreferenced.
  const billRef = name(v.invoiceNumber || "") || `RAO-${v.id.slice(0, 8)}`;

  const entries = v.lines
    .filter((l) => l.debit > 0 || l.credit > 0)
    .map((l) => {
      const isDebit = l.debit > 0;
      // Tally's convention: debits are "deemed positive" and carry a negative
      // amount; credits are the reverse.
      const amount = isDebit ? `-${l.debit.toFixed(2)}` : l.credit.toFixed(2);

      // The allocation amount must match the ledger entry amount exactly, sign
      // included, or Tally rejects the voucher.
      const billAllocation =
        l.role === "PARTY"
          ? `
              <BILLALLOCATIONS.LIST>
                <NAME>${esc(billRef)}</NAME>
                <BILLTYPE>New Ref</BILLTYPE>
                <AMOUNT>${amount}</AMOUNT>
              </BILLALLOCATIONS.LIST>`
          : "";

      const hsn =
        opts.includeGstDetails && l.role === "ITEM" && l.hsnCode
          ? `
              <HSNCODE>${esc(l.hsnCode)}</HSNCODE>`
          : "";

      return `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${esc(name(l.ledgerName))}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${isDebit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount}</AMOUNT>${hsn}${billAllocation}
            </ALLLEDGERENTRIES.LIST>`;
    })
    .join("");

  const narr =
    v.narration ||
    [v.partyName, v.invoiceNumber ? `Inv ${v.invoiceNumber}` : null].filter(Boolean).join(" / ");

  // Derived from the voucher id, not the batch position — a positional
  // fallback made the same voucher show a different number on each re-export.
  const voucherNumber = name(v.invoiceNumber || "") || `RAO-${v.id.slice(0, 8)}`;

  const partyTag = v.partyName
    ? `
          <PARTYLEDGERNAME>${esc(name(v.partyName))}</PARTYLEDGERNAME>`
    : "";

  return `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER REMOTEID="${esc(remoteIdFor(v.id))}" VCHTYPE="${esc(vtype)}" ACTION="Create">
          <DATE>${tallyDate(v.date)}</DATE>
          <NARRATION>${esc(narr || "Imported from RAO AI")}</NARRATION>
          <VOUCHERTYPENAME>${esc(vtype)}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${esc(voucherNumber)}</VOUCHERNUMBER>${partyTag}
          ${entries}
        </VOUCHER>
      </TALLYMESSAGE>`;
}

export function buildTallyXml(opts: {
  companyName?: string | null;
  ledgers: ExportLedger[];
  vouchers: ExportVoucher[];
  /** GST rate effective-from date, YYYYMMDD. Defaults to 1 July 2017. */
  gstApplicableFrom?: string;
  /**
   * Emit GST rate details on masters and HSN on item lines. On by default.
   * Tally's statutory schema shifts between releases — if a real import
   * rejects the GSTDETAILS block, turn this off to fall back to plain
   * accounting vouchers while the shape is corrected.
   */
  includeGstDetails?: boolean;
}) {
  const includeGstDetails = opts.includeGstDetails ?? true;
  const gstApplicableFrom = opts.gstApplicableFrom ?? "20170701";

  // Keyed on the trimmed name so "Acme " and "Acme" collapse to one master
  // rather than being pushed as two.
  const uniqueLedgers = new Map<string, ExportLedger>();
  for (const l of opts.ledgers) {
    const key = name(l.name || "");
    if (key) uniqueLedgers.set(key, l);
  }

  const ledgerBlock = [...uniqueLedgers.values()]
    .map((l) => ledgerXml(l, { gstApplicableFrom, includeGstDetails }))
    .join("");
  const voucherBlock = opts.vouchers
    .map((v) => voucherXml(v, { includeGstDetails }))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${esc(name(opts.companyName || "RAO AI Import"))}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${ledgerBlock}
${voucherBlock}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`;
}

/**
 * Build a "remove these vouchers from Tally" envelope.
 *
 * Deleting needs only the REMOTEID and the voucher type — Tally resolves the
 * target by REMOTEID and ignores the body, which matters because by the time a
 * user asks to un-post something they may well have edited the voucher here.
 * Reconstructing its lines to delete it would mean the delete depended on data
 * that no longer matches what is in Tally.
 *
 * Scoped by construction: only vouchers we posted carry a RAO- REMOTEID, so
 * this cannot reach an entry the accountant keyed in by hand.
 */
export function buildTallyDeleteXml(opts: {
  companyName?: string | null;
  vouchers: Array<{ id: string; voucherType: string }>;
}) {
  const messages = opts.vouchers
    .map((v) => {
      const vtype = TALLY_VOUCHER[v.voucherType] || "Journal";
      return `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER REMOTEID="${esc(remoteIdFor(v.id))}" VCHTYPE="${esc(vtype)}" ACTION="Delete" />
      </TALLYMESSAGE>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${esc(name(opts.companyName || "RAO AI Import"))}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${messages}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}
