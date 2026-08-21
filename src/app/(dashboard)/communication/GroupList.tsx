"use client";

import { useState } from "react";
import { Search, Plus, Pin } from "lucide-react";
import type { Group } from "./mockData";

type GroupListProps = {
  groups: Group[];
  activeGroupId: string | null;
  onSelect: (group: Group) => void;
  onCreateGroup: () => void;
};

const filters = ["All", "My Groups", "Pinned"] as const;

export function GroupList({ groups, activeGroupId, onSelect, onCreateGroup }: GroupListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered = groups.filter((g) => {
    const matchSearch =
      !search || g.name.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Pinned" && g.isPinned) ||
      activeFilter === "My Groups";

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
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "var(--spx-text)", letterSpacing: "0.3px" }}
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1 px-3 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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

      {/* Group Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.map((group) => {
          const isActive = group.id === activeGroupId;
          const onlineCount = group.members.filter((m) => m.user.isOnline).length;

          return (
            <button
              key={group.id}
              onClick={() => onSelect(group)}
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
                {/* Group Avatar */}
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "var(--spx-input-bg)",
                    border: "1px solid var(--spx-border)",
                    fontSize: "15px",
                  }}
                >
                  👥
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + pin + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate text-sm font-medium" style={{ color: "var(--spx-text)" }}>
                        {group.name}
                      </span>
                      {group.isPinned && (
                        <Pin style={{ width: "11px", height: "11px", color: "var(--spx-muted)", transform: "rotate(45deg)" }} strokeWidth={2} />
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs" style={{ color: "var(--spx-muted)" }}>
                      {group.lastMessageTime}
                    </span>
                  </div>

                  {/* Members + online */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "var(--spx-muted)" }}>
                      {group.members.length} members
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#22c55e" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                      {onlineCount} online
                    </span>
                  </div>

                  {/* Last message */}
                  <p className="truncate text-xs mt-1" style={{ color: "var(--spx-text-secondary)" }}>
                    <span style={{ fontWeight: 600 }}>{group.lastMessageSender.split(" ")[0]}:</span>{" "}
                    {group.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {group.unreadCount > 0 && (
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
                    {group.unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Create Group Button */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--spx-border)" }}>
        <button
          onClick={onCreateGroup}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase transition-all duration-150"
          style={{
            borderRadius: "6px",
            background: "var(--spx-text)",
            color: "var(--spx-canvas)",
            letterSpacing: "1.5px",
          }}
        >
          <Plus style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          Create Group
        </button>
      </div>
    </div>
  );
}
