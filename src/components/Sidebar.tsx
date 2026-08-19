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

  return (
    <div className="flex flex-col h-full bg-[#0b0d10] text-white">
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
            }}
          >
            RAO TECH
          </h1>
        </Link>
      </div>
      <div className="px-5 pt-1 pb-4 border-b border-[#2a2d35]">
        <p
          className="text-[#6b6f78] uppercase"
          style={{
            fontSize: "10px",
            letterSpacing: "2.4px",
            fontFamily: "'Inter', 'Geist Sans', system-ui, sans-serif",
          }}
        >
          Operational Center
        </p>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 pt-3 pb-2 space-y-[2px] overflow-y-auto">
        {visibleRoutes.map((route) => {
          const isActive =
            pathname === route.href || pathname.startsWith(route.href + "/");
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 w-full cursor-pointer transition-all duration-150",
                isActive
                  ? "text-white bg-white/[0.08]"
                  : "text-[#6b6f78] hover:text-white hover:bg-white/[0.03]"
              )}
              style={{
                padding: "10px 16px",
                borderLeft: isActive ? "3px solid #ffffff" : "3px solid transparent",
              }}
            >
              <route.icon
                className={cn("flex-shrink-0", isActive ? "text-white" : "text-[#6b6f78]")}
                style={{ width: "18px", height: "18px" }}
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
      <div className="border-t border-[#2a2d35]">
        <SignOutButton>
          <div
            className="flex items-center gap-3 text-[#6b6f78] hover:text-white hover:bg-white/[0.03] cursor-pointer transition-all duration-150"
            style={{
              padding: "12px 16px",
              borderLeft: "3px solid transparent",
            }}
            onClick={onNavigate}
          >
            <LogOut
              className="flex-shrink-0"
              style={{ width: "18px", height: "18px" }}
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
