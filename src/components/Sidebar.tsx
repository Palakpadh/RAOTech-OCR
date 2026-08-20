"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
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
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/nextjs";
import { extraPagesEnabled } from "@/lib/featureFlags";

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "text-sky-500" },
  { label: "Pipeline", icon: Kanban, href: "/pipeline", color: "text-indigo-400", localOnly: true },
  { label: "Upload", icon: UploadCloud, href: "/upload", color: "text-violet-500" },
  { label: "Review queue", icon: Filter, href: "/review", color: "text-rose-400", localOnly: true },
  { label: "Transactions", icon: ListChecks, href: "/transactions", color: "text-emerald-500" },
  { label: "GST Recon", icon: Scale, href: "/gst", color: "text-orange-400", localOnly: true },
  { label: "Reports", icon: BarChart3, href: "/reports", color: "text-cyan-400", localOnly: true },
  { label: "Ledgers & Rules", icon: BookOpen, href: "/settings", color: "text-amber-500" },
  { label: "Intake Links", icon: Link2, href: "/intake", color: "text-pink-400", localOnly: true },
  { label: "Tasks", icon: ClipboardList, href: "/tasks", color: "text-lime-400", localOnly: true },
  { label: "AI Assistant", icon: MessageSquare, href: "/chat", color: "text-pink-700" },
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
    <div className="flex flex-col h-full" style={{ background: "var(--spx-canvas)", color: "var(--spx-text)" }}>
      {/* ── Brand ── */}
      <div className="px-5 pt-5 pb-0">
        <Link href="/dashboard" className="block">
          <h1
            className="font-bold uppercase"
            style={{
              fontSize: "22px",
              letterSpacing: "3px",
              lineHeight: "1.1",
              fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
              color: "var(--spx-text)",
            }}
          >
            RAO TECH
          </h1>
        </Link>
      </div>
      <div className="px-5 pt-1 pb-4" style={{ borderBottom: "1px solid var(--spx-border)" }}>
        <p
          className="uppercase"
          style={{
            fontSize: "10px",
            letterSpacing: "2.4px",
            fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
            color: "var(--spx-muted)",
          }}
        >
          Operational Center
        </p>
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 min-h-0 px-2 pt-3 pb-2 space-y-[2px] overflow-y-auto overscroll-contain"
        style={{ minHeight: 0, overflowY: "auto" }}
      >
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
              className="group flex items-center gap-3 w-full cursor-pointer transition-all duration-150"
              style={{
                padding: "10px 16px",
                borderLeft: isActive ? `3px solid var(--spx-active-border)` : "3px solid transparent",
                background: isActive ? "var(--spx-active-bg)" : "transparent",
                color: isActive ? "var(--spx-text)" : "var(--spx-muted)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--spx-hover-bg)";
                  e.currentTarget.style.color = "var(--spx-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--spx-muted)";
                }
              }}
            >
              <route.icon
                className="flex-shrink-0"
                style={{ width: "18px", height: "18px", color: "inherit" }}
                strokeWidth={1.5}
              />
              <span
                className="uppercase"
                style={{
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  fontWeight: 500,
                  fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
                }}
              >
                {route.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: Settings + Logout ── */}
      <div style={{ borderTop: "1px solid var(--spx-border)" }}>
        {/* Settings Link */}
        <Link
          href="/app-settings"
          onClick={() => {
            logNavClick("/app-settings", "Settings");
            onNavigate?.();
          }}
          className="flex items-center gap-3 cursor-pointer transition-all duration-150"
          style={{
            padding: "12px 16px",
            borderLeft: isSettingsActive ? `3px solid var(--spx-active-border)` : "3px solid transparent",
            background: isSettingsActive ? "var(--spx-active-bg)" : "transparent",
            color: isSettingsActive ? "var(--spx-text)" : "var(--spx-muted)",
          }}
          onMouseEnter={(e) => {
            if (!isSettingsActive) {
              e.currentTarget.style.background = "var(--spx-hover-bg)";
              e.currentTarget.style.color = "var(--spx-text)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSettingsActive) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--spx-muted)";
            }
          }}
        >
          <Settings
            className="flex-shrink-0"
            style={{ width: "18px", height: "18px", color: "inherit" }}
            strokeWidth={1.5}
          />
          <span
            className="uppercase"
            style={{
              fontSize: "12px",
              letterSpacing: "1.5px",
              fontWeight: 500,
              fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
            }}
          >
            Settings
          </span>
        </Link>

        {/* Logout */}
        <SignOutButton>
          <div
            className="flex items-center gap-3 cursor-pointer transition-all duration-150"
            style={{
              padding: "12px 16px",
              borderLeft: "3px solid transparent",
              color: "var(--spx-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--spx-hover-bg)";
              e.currentTarget.style.color = "var(--spx-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--spx-muted)";
            }}
            onClick={onNavigate}
          >
            <LogOut
              className="flex-shrink-0"
              style={{ width: "18px", height: "18px", color: "inherit" }}
              strokeWidth={1.5}
            />
            <span
              className="uppercase"
              style={{
                fontSize: "12px",
                letterSpacing: "1.5px",
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
