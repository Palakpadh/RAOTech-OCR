"use client";

import { useEffect, useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { ClientSwitcher } from "@/components/ClientSwitcher";
import { CommandPalette } from "@/components/CommandPalette";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock the background page from scrolling while the mobile menu is open,
  // so scrolling inside the drawer (e.g. to reach Logout) never scrolls
  // the page behind it. Restored automatically on close/unmount.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <div className="h-full relative" style={{ background: "#0b0d10" }}>
      {/* Desktop Sidebar */}
      <div
        className="hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80]"
        style={{ width: "232px", borderRight: "1px solid #2a2d35" }}
      >
        <Sidebar />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 overscroll-none"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full shadow-2xl flex flex-col"
            style={{ width: "232px", maxWidth: "85vw", background: "#0b0d10", borderRight: "1px solid #2a2d35" }}
          >
            <div
              className="shrink-0"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #2a2d35",
                padding: "12px 16px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  textTransform: "uppercase" as const,
                  letterSpacing: "2px",
                  color: "#6b6f78",
                }}
              >
                Menu
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen md:pl-[232px]" style={{ background: "#0b0d10" }}>
        {/* Top Bar */}
        <div
          className="sticky top-0 z-40 backdrop-blur-sm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            borderBottom: "1px solid #2a2d35",
            background: "rgba(11, 13, 16, 0.95)",
            padding: "10px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "8px",
                background: "#161920",
                border: "1px solid #2a2d35",
                padding: "7px 14px",
                minWidth: "300px",
              }}
            >
              <Search style={{ width: "15px", height: "15px", color: "#6b6f78" }} strokeWidth={1.5} />
              <span style={{ fontSize: "13px", color: "#6b6f78", letterSpacing: "0.3px" }}>
                Search invoices, clients, tasks...
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Tally Sync Status */}
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "8px",
                fontSize: "11px",
                letterSpacing: "1.2px",
                textTransform: "uppercase" as const,
                color: "#6b6f78",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              <span>Tally: Live Sync</span>
            </div>

            <ClientSwitcher />
          </div>
        </div>

        {children}
      </main>

      <CommandPalette />
    </div>
  );
}