"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LedgerSelect,
  type LedgerOption,
} from "@/components/LedgerSelect";

import {
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

interface Ledger extends LedgerOption {
  group: string;
  ledgerType: string;
  isSystem?: boolean;
}

interface Rule {
  id: string;
  ruleType: string;
  pattern: string;
  priority: number;
  enabled: boolean;
  ledger: {
    id: string;
    name: string;
  };
}

const GROUPS = [
  "SUNDRY_CREDITORS",
  "SUNDRY_DEBTORS",
  "DUTIES_AND_TAXES",
  "PURCHASE_ACCOUNTS",
  "SALES_ACCOUNTS",
  "DIRECT_EXPENSES",
  "INDIRECT_EXPENSES",
  "INDIRECT_INCOME",
  "BANK_ACCOUNTS",
  "CASH_IN_HAND",
  "CURRENT_ASSETS",
  "CURRENT_LIABILITIES",
  "FIXED_ASSETS",
];

const RULE_TYPES = [
  {
    value: "GSTIN_EQUALS",
    label: "Vendor GSTIN equals",
  },
  {
    value: "VENDOR_NAME_CONTAINS",
    label: "Vendor name contains",
  },
  {
    value: "VENDOR_NAME_EQUALS",
    label: "Vendor name equals",
  },
  {
    value: "HSN_EQUALS",
    label: "Item HSN equals",
  },
];

export default function LedgerRuleManager({
  ledgers: initialLedgers,
  rules: initialRules,
  clientName,
  mappingAccuracy,
}: {
  ledgers: Ledger[];
  rules: Rule[];
  clientName?: string;
  mappingAccuracy?: number | null;
}) {
  const [tab, setTab] = useState<"ledgers" | "rules">(
    "ledgers"
  );

  const [ledgers, setLedgers] =
    useState<Ledger[]>(initialLedgers);

  const [rules, setRules] =
    useState<Rule[]>(initialRules);

  return (
    <div className="min-h-full bg-[#080808] text-white p-6 md:p-10 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Ledgers & Rules
          </h1>

          <p className="text-zinc-500 text-sm mt-1">
            {clientName ? `${clientName} · ` : ""}
            Chart of accounts and auto-mapping rules
          </p>
        </div>

        {mappingAccuracy != null && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <div className="text-xs text-emerald-400 uppercase font-semibold">
              Mapping accuracy
            </div>

            <div className="text-xl font-bold text-emerald-300">
              {mappingAccuracy}%
            </div>

            <div className="text-xs text-emerald-500">
              auto-mapped lines this client
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">

        <button
          onClick={() => setTab("ledgers")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
            tab === "ledgers"
              ? "bg-white text-black border-white"
              : "bg-[#111111] border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          Chart of Accounts ({ledgers.length})
        </button>

        <button
          onClick={() => setTab("rules")}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
            tab === "rules"
              ? "bg-white text-black border-white"
              : "bg-[#111111] border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          Mapping Rules ({rules.length})
        </button>

      </div>

      {tab === "ledgers" ? (
        <LedgersTab
          ledgers={ledgers}
          setLedgers={setLedgers}
        />
      ) : (
        <RulesTab
          ledgers={ledgers}
          rules={rules}
          setRules={setRules}
        />
      )}

    </div>
  );
}

function LedgersTab({
  ledgers,
  setLedgers,
}: {
  ledgers: Ledger[];
  setLedgers: (l: Ledger[]) => void;
}) {
  const [name, setName] = useState("");
  const [group, setGroup] =
    useState("INDIRECT_EXPENSES");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!name.trim()) return;

    setSaving(true);

    try {
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          group,
          ledgerType: "EXPENSE",
        }),
      });

      const data = await res.json();

      if (res.ok && data.ledger) {
        setLedgers([...ledgers, data.ledger]);
        setName("");
      }
    } finally {
      setSaving(false);
    }
  }

  const byGroup = ledgers.reduce<
    Record<string, Ledger[]>
  >((acc, l) => {
    (acc[l.group] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Add Ledger */}
      <div className="border border-zinc-800 rounded-xl bg-[#0d0d0d] shadow-xl p-5 flex flex-wrap items-end gap-3">

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-zinc-500 block mb-1">
            Ledger name
          </label>

          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Courier Charges"
            className="bg-[#111111] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </div>

        <div className="min-w-[180px]">
          <label className="text-xs text-zinc-500 block mb-1">
            Group
          </label>

          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full rounded-md border border-zinc-800 bg-[#111111] text-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          >
            {GROUPS.map((g) => (
              <option
                key={g}
                value={g}
                className="bg-[#111111]"
              >
                {g.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={add}
          disabled={saving}
          className="bg-white text-black hover:bg-zinc-200"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}

          Add Ledger
        </Button>
      </div>

      {/* Ledger Groups */}
      <div className="grid gap-4 md:grid-cols-2">

        {Object.entries(byGroup).map(
          ([g, items]) => (
            <div
              key={g}
              className="border border-zinc-800 rounded-xl bg-[#0d0d0d] shadow-xl overflow-hidden"
            >

              <div className="px-4 py-3 border-b border-zinc-800 bg-[#111111] text-xs uppercase font-semibold text-zinc-500">
                {g.replaceAll("_", " ")}
              </div>

              <div className="divide-y divide-zinc-800">

                {items.map((l) => (
                  <div
                    key={l.id}
                    className="px-4 py-3 text-sm flex justify-between hover:bg-zinc-900 transition"
                  >
                    <span className="text-zinc-200">
                      {l.name}
                    </span>

                    {l.isSystem && (
                      <span className="text-xs text-zinc-600">
                        system
                      </span>
                    )}
                  </div>
                ))}

              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
}

function RulesTab({
  ledgers,
  rules,
  setRules,
}: {
  ledgers: Ledger[];
  rules: Rule[];
  setRules: (r: Rule[]) => void;
}) {
  const [ruleType, setRuleType] =
    useState("GSTIN_EQUALS");

  const [pattern, setPattern] = useState("");

  const [ledgerId, setLedgerId] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [previewCount, setPreviewCount] =
    useState<number | null>(null);

  async function preview() {
    if (!pattern.trim() || !ledgerId) return;

    const res = await fetch("/api/mapping-rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ruleType,
        pattern,
        ledgerId,
        preview: true,
        previewOnly: true,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setPreviewCount(data.previewCount ?? 0);
    }
  }

  async function add() {
    if (!pattern.trim() || !ledgerId) return;

    setSaving(true);

    try {
      const res = await fetch("/api/mapping-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruleType,
          pattern,
          ledgerId,
          preview: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.rule) {
        setRules([...rules, data.rule]);
        setPattern("");
        setLedgerId(null);
        setPreviewCount(
          data.previewCount ?? null
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(
      `/api/mapping-rules/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setRules(
        rules.filter((r) => r.id !== id)
      );
    }
  }

  return (
    <div className="space-y-6">

      {/* Rule Creator */}
      <div className="border border-zinc-800 rounded-xl bg-[#0d0d0d] shadow-xl p-5 space-y-4">

        <div className="grid gap-3 md:grid-cols-2">

          <div>
            <label className="text-xs text-zinc-500 block mb-1">
              When
            </label>

            <select
              value={ruleType}
              onChange={(e) =>
                setRuleType(e.target.value)
              }
              className="w-full rounded-md border border-zinc-800 bg-[#111111] text-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            >
              {RULE_TYPES.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                  className="bg-[#111111]"
                >
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">
              Value
            </label>

            <Input
              value={pattern}
              onChange={(e) =>
                setPattern(e.target.value)
              }
              placeholder={
                ruleType === "GSTIN_EQUALS"
                  ? "27AABCT1234H2Z0"
                  : "keyword / value"
              }
              className="bg-[#111111] border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>

        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">
            Map to ledger
          </label>

          <LedgerSelect
            ledgers={ledgers}
            value={ledgerId}
            onChange={setLedgerId}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">

          <Button
            variant="outline"
            onClick={preview}
            disabled={!pattern.trim() || !ledgerId}
            className="bg-[#111111] border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Test / Preview
          </Button>

          <Button
            onClick={add}
            disabled={
              saving ||
              !pattern.trim() ||
              !ledgerId
            }
            className="bg-white text-black hover:bg-zinc-200"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}

            Add Rule
          </Button>

          {previewCount != null && (
            <span className="text-sm text-zinc-500">
              Would match{" "}
              <strong className="text-white">
                {previewCount}
              </strong>{" "}
              past invoice(s)
            </span>
          )}

        </div>
      </div>

      {/* Rules Table */}
      <div className="border border-zinc-800 rounded-xl bg-[#0d0d0d] shadow-xl overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">

            <thead className="text-zinc-500 bg-[#111111] uppercase text-xs border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">
                  Condition
                </th>

                <th className="px-4 py-3">
                  Value
                </th>

                <th className="px-4 py-3">
                  Ledger
                </th>

                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>

            <tbody>

              {rules.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-zinc-600"
                  >
                    No rules yet. Rules take priority
                    over learned mappings.
                  </td>
                </tr>
              )}

              {rules.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900 transition"
                >

                  <td className="px-4 py-3 text-zinc-300">
                    {RULE_TYPES.find(
                      (t) => t.value === r.ruleType
                    )?.label || r.ruleType}
                  </td>

                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {r.pattern}
                  </td>

                  <td className="px-4 py-3 text-zinc-200">
                    {r.ledger?.name}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove(r.id)}
                      className="text-zinc-600 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}