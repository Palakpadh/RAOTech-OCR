"use client";

import { UserPlus, Settings, Pin, FileText } from "lucide-react";
import type { Group } from "./mockData";

type GroupInfoPanelProps = {
  group: Group;
  onInviteMember: () => void;
};

const roleBadge: Record<string, { bg: string; text: string }> = {
  admin: { bg: "rgba(139, 92, 246, 0.12)", text: "#8b5cf6" },
  member: { bg: "rgba(107, 114, 128, 0.10)", text: "#6b7280" },
  viewer: { bg: "rgba(59, 130, 246, 0.10)", text: "#3b82f6" },
};

export function GroupInfoPanel({ group, onInviteMember }: GroupInfoPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-4"
        style={{ borderBottom: "1px solid var(--spx-border)" }}
      >
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--spx-muted)", letterSpacing: "1.5px" }}
        >
          Group Info
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group Details */}
        <div className="p-5" style={{ borderBottom: "1px solid var(--spx-border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
                fontSize: "20px",
              }}
            >
              👥
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--spx-text)" }}>
                {group.name}
              </p>
              <p className="text-xs" style={{ color: "var(--spx-muted)" }}>
                Created {group.createdAt}
              </p>
            </div>
          </div>
          {group.description && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--spx-text-secondary)" }}>
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span
              className="text-xs px-2 py-0.5 uppercase"
              style={{
                borderRadius: "3px",
                background: group.groupType === "invite-only" ? "rgba(249, 115, 22, 0.1)" : "rgba(34, 197, 94, 0.1)",
                color: group.groupType === "invite-only" ? "#f97316" : "#22c55e",
                fontSize: "9px",
                letterSpacing: "1px",
                fontWeight: 600,
              }}
            >
              {group.groupType}
            </span>
          </div>
        </div>

        {/* Members List */}
        <div className="p-5" style={{ borderBottom: "1px solid var(--spx-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Members ({group.members.length})
            </p>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "var(--spx-text-secondary)" }}
            >
              <Settings style={{ width: "11px", height: "11px" }} strokeWidth={1.5} />
              Manage
            </button>
          </div>

          <div className="space-y-1">
            {group.members.map((member) => (
              <div
                key={member.user.id}
                className="flex items-center gap-3 px-2 py-2"
                style={{ borderRadius: "6px" }}
              >
                {/* Avatar with online dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "var(--spx-input-bg)",
                      border: "1px solid var(--spx-border)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--spx-text-secondary)",
                    }}
                  >
                    {member.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  {/* Online indicator */}
                  <span
                    className="absolute"
                    style={{
                      bottom: "-1px",
                      right: "-1px",
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      background: member.user.isOnline ? "#22c55e" : "#6b7280",
                      border: "2px solid var(--spx-card)",
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--spx-text)" }}>
                    {member.user.name}
                  </p>
                </div>

                {/* Role badge */}
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 uppercase font-semibold"
                  style={{
                    borderRadius: "3px",
                    background: roleBadge[member.role]?.bg,
                    color: roleBadge[member.role]?.text,
                    fontSize: "9px",
                    letterSpacing: "0.8px",
                  }}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          {/* Invite button */}
          <button
            onClick={onInviteMember}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 text-xs font-semibold uppercase transition-all duration-150"
            style={{
              borderRadius: "6px",
              border: "1px solid var(--spx-border)",
              color: "var(--spx-text)",
              background: "transparent",
              letterSpacing: "1.2px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--spx-hover-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <UserPlus style={{ width: "13px", height: "13px" }} strokeWidth={1.5} />
            Invite Member
          </button>
        </div>

        {/* Pinned Messages */}
        <div className="p-5" style={{ borderBottom: "1px solid var(--spx-border)" }}>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
          >
            Pinned Messages
          </p>
          <div className="space-y-2">
            <div
              className="flex items-start gap-2 px-3 py-2.5"
              style={{
                borderRadius: "6px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border-subtle)",
              }}
            >
              <Pin style={{ width: "11px", height: "11px", color: "#eab308", flexShrink: 0, marginTop: "2px", transform: "rotate(45deg)" }} strokeWidth={2} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--spx-text-secondary)" }}>
                GSTR-3B due date is Aug 20 — all pending invoices must be uploaded before then.
              </p>
            </div>
            <div
              className="flex items-start gap-2 px-3 py-2.5"
              style={{
                borderRadius: "6px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border-subtle)",
              }}
            >
              <Pin style={{ width: "11px", height: "11px", color: "#eab308", flexShrink: 0, marginTop: "2px", transform: "rotate(45deg)" }} strokeWidth={2} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--spx-text-secondary)" }}>
                Use the new ledger mapping rules for all August entries.
              </p>
            </div>
          </div>
        </div>

        {/* Shared Files */}
        <div className="p-5">
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
          >
            Shared Files
          </p>
          <div className="space-y-2">
            {[
              { name: "ITC_Comparison_Aug.xlsx", type: "spreadsheet", size: "245 KB" },
              { name: "GSTR3B_Draft_Jul.pdf", type: "pdf", size: "128 KB" },
              { name: "Bank_Statement_Aug.pdf", type: "pdf", size: "512 KB" },
            ].map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--spx-border-subtle)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--spx-hover-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <FileText style={{ width: "14px", height: "14px", color: "var(--spx-icon-dim)", flexShrink: 0 }} strokeWidth={1.5} />
                <span className="text-xs font-medium truncate" style={{ color: "var(--spx-text-secondary)" }}>
                  {file.name}
                </span>
                <span className="flex-shrink-0 text-xs" style={{ color: "var(--spx-muted)", fontSize: "10px" }}>
                  {file.size}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
