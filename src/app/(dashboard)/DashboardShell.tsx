"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
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

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Menu</span>
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
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="md:pl-72 pb-10 min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              CA workspace ·{" "}
              <kbd className="rounded border bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
                ⌘K
              </kbd>
            </div>
          </div>
          <ClientSwitcher />
        </div>
        {children}
      </main>

      <CommandPalette />
    </div>
  );
}