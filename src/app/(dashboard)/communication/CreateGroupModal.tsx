"use client";

import { useState } from "react";
import { X, Search, Check } from "lucide-react";
import type { User } from "./mockData";

type CreateGroupModalProps = {
  allUsers: User[];
  onClose: () => void;
};

export function CreateGroupModal({ allUsers, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [groupType, setGroupType] = useState<"open" | "invite-only">("invite-only");

  const filteredUsers = allUsers.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
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
            Create Team Group
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Group Name */}
          <div>
            <label
              className="block text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. GST Filing Team Q3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent outline-none text-sm px-3 py-2.5"
              style={{
                borderRadius: "6px",
                border: "1px solid var(--spx-border)",
                background: "var(--spx-input-bg)",
                color: "var(--spx-text)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Description
              <span className="normal-case font-normal" style={{ letterSpacing: "0px" }}> (optional)</span>
            </label>
            <textarea
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-transparent outline-none text-sm px-3 py-2.5 resize-none"
              style={{
                borderRadius: "6px",
                border: "1px solid var(--spx-border)",
                background: "var(--spx-input-bg)",
                color: "var(--spx-text)",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* Add Members */}
          <div>
            <label
              className="block text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Add Members
            </label>

            {/* Selected chips */}
            {selectedUserIds.size > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Array.from(selectedUserIds).map((uid) => {
                  const user = allUsers.find((u) => u.id === uid);
                  if (!user) return null;
                  return (
                    <span
                      key={uid}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1"
                      style={{
                        borderRadius: "100px",
                        background: "var(--spx-input-bg)",
                        border: "1px solid var(--spx-border)",
                        color: "var(--spx-text-secondary)",
                      }}
                    >
                      {user.name.split(" ")[0]}
                      <button onClick={() => toggleUser(uid)} style={{ color: "var(--spx-muted)" }}>
                        <X style={{ width: "10px", height: "10px" }} strokeWidth={2} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <div
              className="flex items-center gap-2 px-3 py-2 mb-2"
              style={{
                borderRadius: "6px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
              }}
            >
              <Search style={{ width: "14px", height: "14px", color: "var(--spx-muted)" }} strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs"
                style={{ color: "var(--spx-text)" }}
              />
            </div>

            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {filteredUsers.map((user) => {
                const selected = selectedUserIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-100"
                    style={{
                      borderRadius: "6px",
                      background: selected ? "var(--spx-active-bg)" : "transparent",
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
            </div>
          </div>

          {/* Group Type */}
          <div>
            <label
              className="block text-xs font-semibold uppercase mb-2"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Group Type
            </label>
            <div className="space-y-2">
              {([
                { value: "open" as const, label: "Open", desc: "Anyone in the org can join" },
                { value: "invite-only" as const, label: "Invite-only", desc: "Members must be invited" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGroupType(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                  style={{
                    borderRadius: "8px",
                    border: `1px solid ${groupType === opt.value ? "var(--spx-active-border)" : "var(--spx-border)"}`,
                    background: groupType === opt.value ? "var(--spx-active-bg)" : "transparent",
                  }}
                >
                  {/* Radio circle */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: `2px solid ${groupType === opt.value ? "var(--spx-active-border)" : "var(--spx-border)"}`,
                    }}
                  >
                    {groupType === opt.value && (
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--spx-text)",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--spx-text)" }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--spx-muted)", fontSize: "10px" }}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
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
            onClick={handleCreate}
            className="px-4 py-2 text-xs font-semibold uppercase transition-all duration-150"
            style={{
              borderRadius: "6px",
              background: name.trim() ? "var(--spx-text)" : "var(--spx-input-bg)",
              color: name.trim() ? "var(--spx-canvas)" : "var(--spx-muted)",
              letterSpacing: "1px",
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
