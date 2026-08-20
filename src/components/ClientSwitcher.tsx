"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Client = {
  id: string;
  name: string;
  gstin: string | null;
  isDefault: boolean;
};

export function ClientSwitcher() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/clients");
    if (!res.ok) return;
    const data = await res.json();
    setClients(data.clients || []);
    setActiveId(data.activeClientId);
  }

  useEffect(() => {
    load();
  }, []);

  const active = clients.find((c) => c.id === activeId) || clients[0];

  async function switchClient(id: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      if (res.ok) {
        setActiveId(id);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function createClient() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.client) {
        setNewName("");
        setCreating(false);
        await switchClient(data.client.id);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 transition"
        style={{
          border: "1px solid var(--spx-border)",
          background: "var(--spx-input-bg)",
          padding: "7px 14px",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--spx-text)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--spx-card-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--spx-input-bg)"; }}
      >
        <Building2 style={{ width: "15px", height: "15px", color: "var(--spx-muted)" }} strokeWidth={1.5} />
        <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {active?.name || "Select client"}
        </span>
        <ChevronDown style={{ width: "14px", height: "14px", color: "var(--spx-muted)" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 shadow-2xl"
          style={{ width: "280px", border: "1px solid var(--spx-border)", background: "var(--spx-card)" }}
        >
          <div style={{ borderBottom: "1px solid var(--spx-border)", padding: "10px 14px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase" as const,
                letterSpacing: "1.5px",
                color: "var(--spx-muted)",
              }}
            >
              Clients
            </span>
          </div>
          <div style={{ maxHeight: "256px", overflowY: "auto", padding: "4px 0" }}>
            {clients.map((c) => (
              <button
                key={c.id}
                disabled={saving}
                onClick={() => switchClient(c.id)}
                className="flex w-full items-center justify-between transition"
                style={{ padding: "10px 14px", textAlign: "left", fontSize: "13px" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--spx-hover-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: "var(--spx-text)" }}>{c.name}</div>
                  {c.gstin && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--spx-muted)",
                        fontFamily: "'Geist Mono', 'Courier New', monospace",
                        marginTop: "2px",
                      }}
                    >
                      {c.gstin}
                    </div>
                  )}
                </div>
                {c.id === activeId && <Check style={{ width: "16px", height: "16px", color: "#4ade80" }} />}
              </button>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--spx-border)", padding: "8px" }}>
            {creating ? (
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Client name"
                  className="h-8"
                  style={{ background: "var(--spx-input-bg)", borderColor: "var(--spx-border)", color: "var(--spx-text)", borderRadius: "0" }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={createClient}
                  disabled={saving}
                  style={{ background: "var(--spx-text)", color: "var(--spx-canvas)", borderRadius: "0", fontWeight: 700 }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                style={{ borderColor: "var(--spx-border)", color: "var(--spx-text-secondary)", borderRadius: "0" }}
                onClick={() => setCreating(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> New client
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
