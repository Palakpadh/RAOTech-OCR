"use client";

import { FileText, ExternalLink, Send, Bell, CheckCircle, UserPlus } from "lucide-react";
import type { Thread } from "./mockData";

type ContextPanelProps = {
  thread: Thread;
};

export function ContextPanel({ thread }: ContextPanelProps) {
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
          Thread Details
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Invoice Preview Card */}
        {thread.invoiceNumber && (
          <div className="p-5" style={{ borderBottom: "1px solid var(--spx-border)" }}>
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
            >
              Linked Invoice
            </p>
            <div
              className="p-4"
              style={{
                borderRadius: "8px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
              }}
            >
              {/* Invoice thumbnail placeholder */}
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  height: "80px",
                  borderRadius: "6px",
                  background: "var(--spx-canvas)",
                  border: "1px solid var(--spx-border-subtle)",
                }}
              >
                <FileText style={{ width: "28px", height: "28px", color: "var(--spx-icon-dim)" }} strokeWidth={1} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Invoice #</span>
                  <span className="text-xs font-medium" style={{ color: "var(--spx-text)", fontFamily: "monospace" }}>
                    {thread.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Vendor</span>
                  <span className="text-xs font-medium" style={{ color: "var(--spx-text)" }}>
                    {thread.clientName}
                  </span>
                </div>
                {thread.gstin && (
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: "var(--spx-muted)" }}>GSTIN</span>
                    <span className="text-xs font-medium" style={{ color: "var(--spx-text)", fontFamily: "monospace" }}>
                      {thread.gstin.slice(0, 10)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Status</span>
                  <span
                    className="text-xs font-medium uppercase"
                    style={{
                      color: thread.status === "open" ? "#22c55e" : thread.status === "waiting" ? "#eab308" : "#6b7280",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {thread.status}
                  </span>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 mt-3 py-2 text-xs font-medium transition-all"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--spx-border)",
                  color: "var(--spx-text-secondary)",
                  background: "transparent",
                }}
              >
                <ExternalLink style={{ width: "12px", height: "12px" }} strokeWidth={1.5} />
                Open Full Invoice
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-5" style={{ borderBottom: "1px solid var(--spx-border)" }}>
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
          >
            Quick Actions
          </p>
          <div className="space-y-2">
            {[
              { icon: Send, label: "Request Missing Document", color: "#3b82f6" },
              { icon: Bell, label: "Send GSTIN Reminder", color: "#f97316" },
              { icon: CheckCircle, label: "Mark as Resolved", color: "#22c55e" },
              { icon: UserPlus, label: "Assign to Team Member", color: "#8b5cf6" },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left"
                style={{
                  borderRadius: "6px",
                  border: "1px solid var(--spx-border)",
                  background: "transparent",
                  color: "var(--spx-text)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--spx-hover-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <action.icon
                  style={{ width: "14px", height: "14px", color: action.color, flexShrink: 0 }}
                  strokeWidth={1.5}
                />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thread Metadata */}
        <div className="p-5">
          <p
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: "var(--spx-muted)", letterSpacing: "1.2px" }}
          >
            Info
          </p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Priority</span>
              <span
                className="text-xs font-semibold uppercase"
                style={{
                  color:
                    thread.priority === "urgent" ? "#ef4444"
                      : thread.priority === "high" ? "#f97316"
                        : thread.priority === "medium" ? "#eab308"
                          : "#6b7280",
                  letterSpacing: "0.5px",
                }}
              >
                {thread.priority}
              </span>
            </div>
            {thread.assignedTo && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--spx-muted)" }}>Assigned</span>
                <span className="text-xs font-medium" style={{ color: "var(--spx-text)" }}>
                  {thread.assignedTo === "u1" ? "Nitin Patidar" : thread.assignedTo === "u2" ? "Rahul Sharma" : thread.assignedTo === "u3" ? "Priya Desai" : thread.assignedTo}
                </span>
              </div>
            )}
            {thread.tags.length > 0 && (
              <div>
                <span className="text-xs block mb-2" style={{ color: "var(--spx-muted)" }}>Tags</span>
                <div className="flex flex-wrap gap-1">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5"
                      style={{
                        borderRadius: "100px",
                        background: "var(--spx-input-bg)",
                        color: "var(--spx-text-secondary)",
                        border: "1px solid var(--spx-border-subtle)",
                        fontSize: "10px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
