"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import type { Thread } from "./mockData";

type ThreadListProps = {
  threads: Thread[];
  activeThreadId: string | null;
  onSelect: (thread: Thread) => void;
};

const filters = ["All", "Unread", "Needs Reply", "Internal", "Resolved"] as const;

const statusDot: Record<Thread["status"], string> = {
  open: "#22c55e",
  waiting: "#eab308",
  resolved: "#6b7280",
};

const priorityBadge: Record<Thread["priority"], { bg: string; text: string }> = {
  urgent: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
  high: { bg: "rgba(249, 115, 22, 0.12)", text: "#f97316" },
  medium: { bg: "rgba(234, 179, 8, 0.10)", text: "#eab308" },
  low: { bg: "rgba(107, 114, 128, 0.10)", text: "#6b7280" },
};

export function ThreadList({ threads, activeThreadId, onSelect }: ThreadListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered = threads.filter((t) => {
    const matchSearch =
      !search ||
      t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (t.invoiceNumber ?? "").toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Unread" && t.unreadCount > 0) ||
      (activeFilter === "Needs Reply" && t.status === "waiting") ||
      (activeFilter === "Resolved" && t.status === "resolved");

    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: "var(--spx-input-bg)",
            border: "1px solid var(--spx-border)",
            borderRadius: "6px",
          }}
        >
          <Search style={{ width: "14px", height: "14px", color: "var(--spx-muted)", flexShrink: 0 }} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search clients, invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "var(--spx-text)", letterSpacing: "0.3px" }}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div
        className="flex gap-1 px-3 pb-3 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-3 py-1 text-xs font-medium transition-all duration-150"
            style={{
              borderRadius: "100px",
              background: activeFilter === f ? "var(--spx-text)" : "var(--spx-input-bg)",
              color: activeFilter === f ? "var(--spx-canvas)" : "var(--spx-muted)",
              letterSpacing: "0.5px",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Thread Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.map((thread) => {
          const isActive = thread.id === activeThreadId;
          return (
            <button
              key={thread.id}
              onClick={() => onSelect(thread)}
              className="w-full text-left transition-all duration-100"
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--spx-border-subtle)",
                background: isActive ? "var(--spx-active-bg)" : "transparent",
                borderLeft: isActive ? "3px solid var(--spx-active-border)" : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--spx-hover-bg)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--spx-input-bg)",
                    border: "1px solid var(--spx-border)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--spx-text-secondary)",
                  }}
                >
                  {thread.clientName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex-shrink-0"
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: statusDot[thread.status],
                        }}
                      />
                      <span
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--spx-text)" }}
                      >
                        {thread.clientName}
                      </span>
                    </div>
                    <span
                      className="flex-shrink-0 text-xs"
                      style={{ color: "var(--spx-muted)" }}
                    >
                      {thread.lastMessageTime}
                    </span>
                  </div>

                  {/* Invoice + priority */}
                  <div className="flex items-center gap-2 mt-1">
                    {thread.invoiceNumber && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--spx-muted)", fontFamily: "monospace", letterSpacing: "0.5px" }}
                      >
                        {thread.invoiceNumber}
                      </span>
                    )}
                    {thread.priority !== "low" && (
                      <span
                        className="text-xs px-2 py-0.5 font-medium uppercase"
                        style={{
                          borderRadius: "3px",
                          background: priorityBadge[thread.priority].bg,
                          color: priorityBadge[thread.priority].text,
                          fontSize: "10px",
                          letterSpacing: "0.8px",
                        }}
                      >
                        {thread.priority}
                      </span>
                    )}
                  </div>

                  {/* Last message */}
                  <p
                    className="truncate text-xs mt-1"
                    style={{ color: "var(--spx-text-secondary)" }}
                  >
                    {thread.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {thread.unreadCount > 0 && (
                  <span
                    className="flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#3b82f6",
                      color: "#ffffff",
                      fontSize: "10px",
                    }}
                  >
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-xs" style={{ color: "var(--spx-muted)" }}>
              No threads found
            </p>
          </div>
        )}
      </div>

      {/* New Thread Button */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--spx-border)" }}>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase transition-all duration-150"
          style={{
            borderRadius: "6px",
            background: "var(--spx-text)",
            color: "var(--spx-canvas)",
            letterSpacing: "1.5px",
          }}
        >
          <Plus style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          New Thread
        </button>
      </div>
    </div>
  );
}
