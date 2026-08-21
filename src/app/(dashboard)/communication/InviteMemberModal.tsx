"use client";

import { useState } from "react";
import { X, Search, Link2, Copy, Check } from "lucide-react";
import type { Group, User } from "./mockData";

type InviteMemberModalProps = {
  group: Group;
  allUsers: User[];
  onClose: () => void;
};

type InviteRole = "admin" | "member" | "viewer";

export function InviteMemberModal({ group, allUsers, onClose }: InviteMemberModalProps) {
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [emailInput, setEmailInput] = useState("");
  const [emailInvites, setEmailInvites] = useState<string[]>([]);
  const [role, setRole] = useState<InviteRole>("member");
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkExpiry, setLinkExpiry] = useState("7");

  const existingMemberIds = new Set(group.members.map((m) => m.user.id));
  const availableUsers = allUsers.filter(
    (u) => !existingMemberIds.has(u.id) && (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !emailInvites.includes(email)) {
      setEmailInvites((prev) => [...prev, email]);
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setEmailInvites((prev) => prev.filter((e) => e !== email));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://app.raotech.in/invite/${group.id}?expires=${linkExpiry}d`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSendInvites = () => {
    // Mock — in real app, call API
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "var(--spx-overlay)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        style={{
          borderRadius: "12px",
          background: "var(--spx-card)",
          border: "1px solid var(--spx-border)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--spx-border)" }}
        >
          <p
            className="text-sm font-semibold uppercase"
            style={{ color: "var(--spx-text)", letterSpacing: "1.5px" }}
          >
            Invite Team Members
          </p>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{ width: "28px", height: "28px", borderRadius: "6px", color: "var(--spx-muted)" }}
          >
            <X style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Search existing users */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}>
              Platform Users
            </p>
            <div
              className="flex items-center gap-2 px-3 py-2 mb-3"
              style={{
                borderRadius: "6px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
              }}
            >
              <Search style={{ width: "14px", height: "14px", color: "var(--spx-muted)" }} strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--spx-text)" }}
              />
            </div>

            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {availableUsers.map((user) => {
                const selected = selectedUserIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100"
                    style={{
                      borderRadius: "6px",
                      background: selected ? "var(--spx-active-bg)" : "transparent",
                      border: selected ? "1px solid var(--spx-border)" : "1px solid transparent",
                    }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "3px",
                        border: `1.5px solid ${selected ? "#3b82f6" : "var(--spx-border)"}`,
                        background: selected ? "#3b82f6" : "transparent",
                      }}
                    >
                      {selected && <Check style={{ width: "10px", height: "10px", color: "#fff" }} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--spx-text)" }}>
                        {user.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--spx-muted)", fontSize: "10px" }}>
                        {user.email}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: user.isOnline ? "#22c55e" : "#6b7280",
                      }}
                    />
                  </button>
                );
              })}
              {availableUsers.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "var(--spx-muted)" }}>
                  {search ? "No users found" : "All platform users are already members"}
                </p>
              )}
            </div>
          </div>

          {/* Invite by email */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}>
              Invite by Email
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
                className="flex-1 bg-transparent outline-none text-xs px-3 py-2"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--spx-border)",
                  background: "var(--spx-input-bg)",
                  color: "var(--spx-text)",
                }}
              />
              <button
                onClick={addEmail}
                className="px-3 py-2 text-xs font-semibold"
                style={{
                  borderRadius: "6px",
                  background: "var(--spx-text)",
                  color: "var(--spx-canvas)",
                }}
              >
                + Add
              </button>
            </div>
            {emailInvites.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emailInvites.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1"
                    style={{
                      borderRadius: "100px",
                      background: "var(--spx-input-bg)",
                      border: "1px solid var(--spx-border)",
                      color: "var(--spx-text-secondary)",
                    }}
                  >
                    {email}
                    <button onClick={() => removeEmail(email)} style={{ color: "var(--spx-muted)" }}>
                      <X style={{ width: "10px", height: "10px" }} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Role selector */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}>
              Role for New Members
            </p>
            <div className="flex gap-2">
              {(["admin", "member", "viewer"] as InviteRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="flex-1 py-2 text-xs font-medium uppercase transition-all duration-150"
                  style={{
                    borderRadius: "6px",
                    border: `1px solid ${role === r ? "var(--spx-active-border)" : "var(--spx-border)"}`,
                    background: role === r ? "var(--spx-active-bg)" : "transparent",
                    color: role === r ? "var(--spx-text)" : "var(--spx-muted)",
                    letterSpacing: "1px",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Invite link */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}>
              Share Invite Link
            </p>
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderRadius: "6px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
              }}
            >
              <Link2 style={{ width: "13px", height: "13px", color: "var(--spx-muted)", flexShrink: 0 }} strokeWidth={1.5} />
              <span className="flex-1 text-xs truncate" style={{ color: "var(--spx-text-secondary)", fontFamily: "monospace" }}>
                https://app.raotech.in/invite/{group.id.slice(0, 6)}...
              </span>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium"
                style={{
                  borderRadius: "4px",
                  background: linkCopied ? "rgba(34, 197, 94, 0.1)" : "var(--spx-hover-bg)",
                  color: linkCopied ? "#22c55e" : "var(--spx-text-secondary)",
                }}
              >
                {linkCopied ? <Check style={{ width: "11px", height: "11px" }} strokeWidth={2} /> : <Copy style={{ width: "11px", height: "11px" }} strokeWidth={1.5} />}
                {linkCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Expires in:</span>
              <select
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
                className="text-xs bg-transparent outline-none px-2 py-1"
                style={{
                  borderRadius: "4px",
                  border: "1px solid var(--spx-border)",
                  color: "var(--spx-text-secondary)",
                  background: "var(--spx-input-bg)",
                }}
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid var(--spx-border)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold uppercase"
            style={{
              borderRadius: "6px",
              border: "1px solid var(--spx-border)",
              color: "var(--spx-text-secondary)",
              background: "transparent",
              letterSpacing: "1px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvites}
            className="px-4 py-2 text-xs font-semibold uppercase"
            style={{
              borderRadius: "6px",
              background: "var(--spx-text)",
              color: "var(--spx-canvas)",
              letterSpacing: "1px",
            }}
          >
            Send Invites
          </button>
        </div>
      </div>
    </div>
  );
}
