"use client";

import { useState } from "react";
import { ThreadList } from "./ThreadList";
import { GroupList } from "./GroupList";
import { ChatFeed } from "./ChatFeed";
import { ContextPanel } from "./ContextPanel";
import { GroupInfoPanel } from "./GroupInfoPanel";
import { InviteMemberModal } from "./InviteMemberModal";
import { CreateGroupModal } from "./CreateGroupModal";
import {
  mockThreads,
  mockGroups,
  mockMessagesThread1,
  mockMessagesGroup1,
  mockUsers,
} from "./mockData";
import type { Thread, Group, Message } from "./mockData";

type ActiveTab = "clients" | "teams";
type ActiveConversation =
  | { type: "thread"; data: Thread }
  | { type: "group"; data: Group }
  | null;

export function CommunicationClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("clients");
  const [activeConversation, setActiveConversation] = useState<ActiveConversation>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Get messages for the active conversation
  const activeMessages: Message[] =
    activeConversation?.type === "thread" && activeConversation.data.id === "t1"
      ? mockMessagesThread1
      : activeConversation?.type === "group" && activeConversation.data.id === "g1"
        ? mockMessagesGroup1
        : [];

  const handleSelectThread = (thread: Thread) => {
    setActiveConversation({ type: "thread", data: thread });
    setMobileView("chat");
  };

  const handleSelectGroup = (group: Group) => {
    setActiveConversation({ type: "group", data: group });
    setMobileView("chat");
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  return (
    <div className="h-[calc(100vh-49px)] flex overflow-hidden" style={{ background: "var(--spx-canvas)" }}>
      {/* ── Left Panel: Thread/Group List ── */}
      <div
        className={`flex-shrink-0 flex flex-col border-r ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}
        style={{
          width: "320px",
          maxWidth: "100vw",
          borderColor: "var(--spx-border)",
          background: "var(--spx-card)",
        }}
      >
        {/* Tab Switcher */}
        <div
          className="flex-shrink-0 flex gap-1 p-3"
          style={{ borderBottom: "1px solid var(--spx-border)" }}
        >
          <button
            onClick={() => setActiveTab("clients")}
            className="flex-1 py-2 px-3 text-xs font-semibold uppercase tracking-wider transition-all duration-150"
            style={{
              borderRadius: "6px",
              background: activeTab === "clients" ? "var(--spx-text)" : "transparent",
              color: activeTab === "clients" ? "var(--spx-canvas)" : "var(--spx-muted)",
              letterSpacing: "1.5px",
            }}
          >
            Clients
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className="flex-1 py-2 px-3 text-xs font-semibold uppercase tracking-wider transition-all duration-150"
            style={{
              borderRadius: "6px",
              background: activeTab === "teams" ? "var(--spx-text)" : "transparent",
              color: activeTab === "teams" ? "var(--spx-canvas)" : "var(--spx-muted)",
              letterSpacing: "1.5px",
            }}
          >
            Teams
          </button>
        </div>

        {/* Thread or Group list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === "clients" ? (
            <ThreadList
              threads={mockThreads}
              activeThreadId={activeConversation?.type === "thread" ? activeConversation.data.id : null}
              onSelect={handleSelectThread}
            />
          ) : (
            <GroupList
              groups={mockGroups}
              activeGroupId={activeConversation?.type === "group" ? activeConversation.data.id : null}
              onSelect={handleSelectGroup}
              onCreateGroup={() => setCreateGroupModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* ── Center Panel: Chat Feed ── */}
      <div
        className={`flex-1 min-w-0 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
      >
        {activeConversation ? (
          <ChatFeed
            conversation={activeConversation}
            messages={activeMessages}
            onBack={handleBackToList}
            onToggleContext={() => setContextPanelOpen(!contextPanelOpen)}
            contextPanelOpen={contextPanelOpen}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: "var(--spx-muted)" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "var(--spx-input-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                </svg>
              </div>
              <p className="text-sm font-medium uppercase" style={{ letterSpacing: "1.5px" }}>
                Select a conversation
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--spx-muted)" }}>
                Choose a client thread or team group to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel: Context / Group Info ── */}
      {contextPanelOpen && activeConversation && (
        <div
          className="hidden lg:flex flex-shrink-0 flex-col border-l overflow-y-auto"
          style={{
            width: "320px",
            borderColor: "var(--spx-border)",
            background: "var(--spx-card)",
          }}
        >
          {activeConversation.type === "thread" ? (
            <ContextPanel thread={activeConversation.data} />
          ) : (
            <GroupInfoPanel
              group={activeConversation.data}
              onInviteMember={() => setInviteModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {inviteModalOpen && activeConversation?.type === "group" && (
        <InviteMemberModal
          group={activeConversation.data}
          allUsers={mockUsers}
          onClose={() => setInviteModalOpen(false)}
        />
      )}

      {createGroupModalOpen && (
        <CreateGroupModal
          allUsers={mockUsers}
          onClose={() => setCreateGroupModalOpen(false)}
        />
      )}
    </div>
  );
}
