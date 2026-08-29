"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  UploadCloud,
  MessageSquare,
  MessagesSquare,
  LogOut,
  BookOpen,
  ListChecks,
  Scale,
  BarChart3,
  Kanban,
  Link2,
  ClipboardList,
  Filter,
  Settings,
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { extraPagesEnabled } from "@/lib/featureFlags";

const routes = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Pipeline", icon: Kanban, href: "/pipeline", localOnly: true },
  { label: "Upload", icon: UploadCloud, href: "/upload" },
  { label: "Review queue", icon: Filter, href: "/review", localOnly: true },
  { label: "Transactions", icon: ListChecks, href: "/transactions" },
  { label: "GST Recon", icon: Scale, href: "/gst", localOnly: true },
  { label: "Reports", icon: BarChart3, href: "/reports", localOnly: true },
  { label: "Ledgers & Rules", icon: BookOpen, href: "/settings" },
  { label: "Intake Links", icon: Link2, href: "/intake", localOnly: true },
  { label: "Tasks", icon: ClipboardList, href: "/tasks", localOnly: true },
  { label: "AI Assistant", icon: MessageSquare, href: "/chat" },
  { label: "Communication", icon: MessagesSquare, href: "/communication" },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const showExtraPages = extraPagesEnabled();
  const visibleRoutes = routes.filter((route) => showExtraPages || !route.localOnly);

  const logNavClick = (href: string, label: string) => {
    if (process.env.NEXT_PUBLIC_TRACE_LOGS === "0") return;
    console.log("[trace][sidebar] nav:click", {
      from: pathname,
      to: href,
      label,
      at: new Date().toISOString(),
    });
  };

  const isSettingsActive = pathname === "/app-settings" || pathname.startsWith("/app-settings/");

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        background: "var(--spx-sidebar-bg)",
        color: "var(--spx-sidebar-text)",
      }}
    >
      {/* ── Brand Header ── */}
      <div className="px-6 pt-6 pb-3">
        <Link href="/dashboard" className="block">
          <h1
            className="font-bold text-xl tracking-tight"
            style={{
              fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
              color: "var(--spx-sidebar-text)",
            }}
          >
            RAO TECH
          </h1>
          <p
            className="text-[11px] font-medium tracking-wider uppercase mt-0.5"
            style={{
              color: "var(--spx-sidebar-muted)",
            }}
          >
            Operational Center
          </p>
        </Link>
      </div>

      {/* ── Navigation List ── */}
      <nav className="flex-1 min-h-0 px-4 py-2 space-y-1.5 overflow-y-auto overscroll-contain">
        {visibleRoutes.map((route) => {
          const isActive =
            pathname === route.href || pathname.startsWith(route.href + "/");

          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => {
                logNavClick(route.href, route.label);
                onNavigate?.();
              }}
              className="group flex items-center gap-4.5 w-full cursor-pointer transition-all duration-200"
              style={{
                padding: "14px 20px",
                borderRadius: "18px",
                background: isActive
                  ? "var(--spx-sidebar-active-bg)"
                  : "transparent",
                color: isActive
                  ? "var(--spx-sidebar-active-text)"
                  : "var(--spx-sidebar-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--spx-sidebar-hover-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <route.icon
                className="flex-shrink-0 transition-colors"
                style={{
                  width: "20px",
                  height: "20px",
                  color: isActive
                    ? "var(--spx-sidebar-active-icon)"
                    : "var(--spx-sidebar-inactive-icon)",
                }}
                strokeWidth={2}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
                }}
              >
                {route.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Actions: Settings & Logout ── */}
      <div className="px-4 py-3 space-y-1.5 border-t border-[var(--spx-sidebar-border)]">
        {/* Settings Link */}
        <Link
          href="/app-settings"
          onClick={() => {
            logNavClick("/app-settings", "Settings");
            onNavigate?.();
          }}
          className="flex items-center gap-4.5 w-full cursor-pointer transition-all duration-200"
          style={{
            padding: "14px 20px",
            borderRadius: "18px",
            background: isSettingsActive
              ? "var(--spx-sidebar-active-bg)"
              : "transparent",
            color: isSettingsActive
              ? "var(--spx-sidebar-active-text)"
              : "var(--spx-sidebar-muted)",
          }}
          onMouseEnter={(e) => {
            if (!isSettingsActive) {
              e.currentTarget.style.background = "var(--spx-sidebar-hover-bg)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSettingsActive) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <Settings
            className="flex-shrink-0 transition-colors"
            style={{
              width: "20px",
              height: "20px",
              color: isSettingsActive
                ? "var(--spx-sidebar-active-icon)"
                : "var(--spx-sidebar-inactive-icon)",
            }}
            strokeWidth={2}
          />
          <span
            style={{
              fontSize: "15px",
              fontWeight: isSettingsActive ? 600 : 500,
              fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
            }}
          >
            Settings
          </span>
        </Link>

        {/* Logout Button */}
        <SignOutButton>
          <div
            className="flex items-center gap-4.5 w-full cursor-pointer transition-all duration-200"
            style={{
              padding: "14px 20px",
              borderRadius: "18px",
              background: "transparent",
              color: "var(--spx-sidebar-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--spx-sidebar-hover-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={onNavigate}
          >
            <LogOut
              className="flex-shrink-0"
              style={{
                width: "20px",
                height: "20px",
                color: "var(--spx-sidebar-inactive-icon)",
              }}
              strokeWidth={2}
            />
            <span
              style={{
                fontSize: "15px",
                fontWeight: 500,
                fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
              }}
            >
              Logout
            </span>
          </div>
        </SignOutButton>
      </div>
    </div>
  );
}
