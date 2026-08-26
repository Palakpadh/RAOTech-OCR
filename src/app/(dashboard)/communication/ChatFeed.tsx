"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  PanelRightOpen,
  PanelRightClose,
  MoreVertical,
  Paperclip,
  Send,
  Zap,
  Users,
} from "lucide-react";
import type { Thread, Group, Message } from "./mockData";

type ChatFeedProps = {
  conversation:
    | { type: "thread"; data: Thread }
    | { type: "group"; data: Group };
  messages: Message[];
  onBack: () => void;
  onToggleContext: () => void;
  contextPanelOpen: boolean;
};

type Channel = "whatsapp" | "email" | "internal";

const channelColors: Record<Channel, { bg: string; border: string; label: string }> = {
  whatsapp: { bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.25)", label: "WhatsApp" },
  email: { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.25)", label: "Email" },
  internal: { bg: "rgba(234, 179, 8, 0.08)", border: "rgba(234, 179, 8, 0.25)", label: "Internal" },
};

const channelIcons: Record<Channel, string> = {
  whatsapp: "💬",
  email: "📧",
  internal: "📝",
};

export function ChatFeed({
  conversation,
  messages,
  onBack,
  onToggleContext,
  contextPanelOpen,
}: ChatFeedProps) {
  const [input, setInput] = useState("");
  const [activeChannel, setActiveChannel] = useState<Channel>(
    conversation.type === "group" ? "internal" : "whatsapp"
  );
  const feedRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const isThread = conversation.type === "thread";
  const title = isThread ? conversation.data.clientName : conversation.data.name;
  const subtitle = isThread
    ? conversation.data.invoiceNumber ?? conversation.data.gstin ?? ""
    : `${conversation.data.members.length} members`;

  const handleSend = () => {
    if (!input.trim()) return;
    // Mock — in real app this would call an API
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header Bar ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-3"
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--spx-border)",
          background: "var(--spx-card)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile back button */}
          <button
            onClick={onBack}
            className="md:hidden flex-shrink-0"
            style={{ color: "var(--spx-text)" }}
          >
            <ArrowLeft style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />
          </button>

          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: isThread ? "50%" : "8px",
              background: "var(--spx-input-bg)",
              border: "1px solid var(--spx-border)",
              fontSize: isThread ? "13px" : "15px",
              fontWeight: 600,
              color: "var(--spx-text-secondary)",
            }}
          >
            {isThread ? title.charAt(0) : "👥"}
          </div>

          {/* Title + subtitle */}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--spx-text)" }}>
              {title}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--spx-muted)", fontFamily: "monospace" }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Thread status badge */}
          {isThread && (
            <span
              className="hidden sm:inline-block text-xs px-2.5 py-1 font-medium uppercase"
              style={{
                borderRadius: "4px",
                background: conversation.data.status === "open"
                  ? "rgba(34, 197, 94, 0.12)"
                  : conversation.data.status === "waiting"
                    ? "rgba(234, 179, 8, 0.12)"
                    : "rgba(107, 114, 128, 0.12)",
                color: conversation.data.status === "open"
                  ? "#22c55e"
                  : conversation.data.status === "waiting"
                    ? "#eab308"
                    : "#6b7280",
                fontSize: "10px",
                letterSpacing: "1px",
              }}
            >
              {conversation.data.status === "waiting" ? "Waiting" : conversation.data.status}
            </span>
          )}

          {/* Group member count */}
          {!isThread && (
            <button
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5"
              style={{
                borderRadius: "4px",
                background: "var(--spx-input-bg)",
                color: "var(--spx-text-secondary)",
                border: "1px solid var(--spx-border)",
              }}
            >
              <Users style={{ width: "12px", height: "12px" }} strokeWidth={1.5} />
              {conversation.data.members.length}
            </button>
          )}

          {/* Context panel toggle */}
          <button
            onClick={onToggleContext}
            className="hidden lg:flex items-center justify-center"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: contextPanelOpen ? "var(--spx-active-bg)" : "transparent",
              color: "var(--spx-text-secondary)",
            }}
          >
            {contextPanelOpen ? (
              <PanelRightClose style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
            ) : (
              <PanelRightOpen style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
            )}
          </button>

          {/* Menu */}
          <button
            className="flex items-center justify-center"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              color: "var(--spx-muted)",
            }}
          >
            <MoreVertical style={{ width: "16px", height: "16px" }} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Message Feed ── */}
      <div
        ref={feedRef}
        className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4"
        style={{ background: "var(--spx-canvas)" }}
      >
        {messages.map((msg) => {
          const isSystem = msg.sender === "system";
          const isTeam = msg.sender === "team";
          const isInternalNote = msg.isInternalNote;

          // System messages — centered
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div
                  className="text-center px-4 py-2 text-xs max-w-md"
                  style={{
                    borderRadius: "100px",
                    background: "var(--spx-input-bg)",
                    color: "var(--spx-muted)",
                    border: "1px solid var(--spx-border-subtle)",
                    letterSpacing: "0.3px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          // Determine alignment & colors
          const isRight = isTeam && !isInternalNote;
          const channelStyle = channelColors[msg.channel];

          // Internal notes — special amber tint
          const bubbleBg = isInternalNote
            ? "rgba(234, 179, 8, 0.08)"
            : isRight
              ? channelStyle.bg
              : "var(--spx-card)";
          const bubbleBorder = isInternalNote
            ? "rgba(234, 179, 8, 0.2)"
            : isRight
              ? channelStyle.border
              : "var(--spx-border)";

          return (
            <div
              key={msg.id}
              className={`flex ${isRight ? "justify-end" : "justify-start"}`}
            >
              <div style={{ maxWidth: "75%" }}>
                {/* Sender name (group mode or internal notes) */}
                {(!isRight || isInternalNote) && (
                  <div className="flex items-center gap-2 mb-1">
                    {isInternalNote && <span style={{ fontSize: "12px" }}>📝</span>}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--spx-text-secondary)", letterSpacing: "0.3px" }}
                    >
                      {msg.senderName}
                    </span>
                    {isInternalNote && (
                      <span
                        className="text-xs px-1.5 py-0.5 uppercase"
                        style={{
                          borderRadius: "3px",
                          background: "rgba(234, 179, 8, 0.12)",
                          color: "#eab308",
                          fontSize: "9px",
                          letterSpacing: "1px",
                          fontWeight: 600,
                        }}
                      >
                        Internal
                      </span>
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className="px-4 py-3"
                  style={{
                    borderRadius: isRight ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: bubbleBg,
                    border: `1px solid ${bubbleBorder}`,
                  }}
                >
                  {/* Mentions highlighting */}
                  <p className="text-sm leading-relaxed" style={{ color: "var(--spx-text)" }}>
                    {msg.content.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith("@") ? (
                        <span
                          key={i}
                          className="font-semibold px-0.5"
                          style={{
                            color: "#3b82f6",
                            background: "rgba(59, 130, 246, 0.1)",
                            borderRadius: "3px",
                          }}
                        >
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-3 py-2 text-xs"
                          style={{
                            borderRadius: "6px",
                            background: "var(--spx-input-bg)",
                            border: "1px solid var(--spx-border)",
                            color: "var(--spx-text-secondary)",
                          }}
                        >
                          <span>📄</span>
                          <span className="truncate font-medium">{att.name}</span>
                          <span style={{ color: "var(--spx-muted)" }}>{att.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timestamp + delivery status + channel */}
                <div className={`flex items-center gap-2 mt-1 ${isRight ? "justify-end" : ""}`}>
                  <span className="text-xs" style={{ color: "var(--spx-muted)", fontSize: "10px" }}>
                    {msg.timestamp}
                  </span>
                  {msg.channel !== "internal" && (
                    <span style={{ fontSize: "10px" }}>
                      {channelIcons[msg.channel]}
                    </span>
                  )}
                  {isRight && msg.deliveryStatus && (
                    <span className="text-xs" style={{ color: "var(--spx-muted)", fontSize: "10px" }}>
                      {msg.deliveryStatus === "read" ? "✓✓" : msg.deliveryStatus === "delivered" ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs" style={{ color: "var(--spx-muted)" }}>
              No messages yet. Start the conversation below.
            </p>
          </div>
        )}
      </div>

      {/* ── Composer Bar ── */}
      <div
        className="flex-shrink-0"
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--spx-border)",
          background: "var(--spx-card)",
        }}
      >
        {/* Channel Toggle (only for client threads) */}
        {isThread && (
          <div className="flex items-center gap-1 mb-3">
            {(["whatsapp", "email", "internal"] as Channel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-150"
                style={{
                  borderRadius: "100px",
                  border: `1px solid ${activeChannel === ch ? channelColors[ch].border : "var(--spx-border)"}`,
                  background: activeChannel === ch ? channelColors[ch].bg : "transparent",
                  color: activeChannel === ch ? "var(--spx-text)" : "var(--spx-muted)",
                  letterSpacing: "0.3px",
                }}
              >
                {channelIcons[ch]} {channelColors[ch].label}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* Attachment */}
          <button
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "var(--spx-input-bg)",
              border: "1px solid var(--spx-border)",
              color: "var(--spx-muted)",
            }}
          >
            <Paperclip style={{ width: "15px", height: "15px" }} strokeWidth={1.5} />
          </button>

          {/* Quick templates */}
          {isThread && (
            <button
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--spx-input-bg)",
                border: "1px solid var(--spx-border)",
                color: "var(--spx-muted)",
              }}
            >
              <Zap style={{ width: "15px", height: "15px" }} strokeWidth={1.5} />
            </button>
          )}

          {/* Text input */}
          <div
            className="flex-1"
            style={{
              borderRadius: "8px",
              background: "var(--spx-input-bg)",
              border: "1px solid var(--spx-border)",
              padding: "8px 14px",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                conversation.type === "group"
                  ? "Type a message... (use @ to mention)"
                  : `Send via ${channelColors[activeChannel].label}...`
              }
              rows={1}
              className="w-full bg-transparent outline-none resize-none text-sm"
              style={{
                color: "var(--spx-text)",
                maxHeight: "100px",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            className="flex-shrink-0 flex items-center justify-center transition-all duration-150"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: input.trim() ? "var(--spx-text)" : "var(--spx-input-bg)",
              color: input.trim() ? "var(--spx-canvas)" : "var(--spx-muted)",
              border: input.trim() ? "none" : "1px solid var(--spx-border)",
            }}
          >
            <Send style={{ width: "15px", height: "15px" }} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
