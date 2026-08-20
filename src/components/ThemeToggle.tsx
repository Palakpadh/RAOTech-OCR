"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--spx-border)",
        background: "var(--spx-card)",
      }}
    >
      <button
        onClick={() => setTheme("dark")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase" as const,
          color: theme === "dark" ? "var(--spx-text)" : "var(--spx-muted)",
          background: theme === "dark" ? "var(--spx-active-bg)" : "transparent",
          border: "none",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <Moon style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
        Dark
      </button>
      <button
        onClick={() => setTheme("light")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase" as const,
          color: theme === "light" ? "var(--spx-text)" : "var(--spx-muted)",
          background: theme === "light" ? "var(--spx-active-bg)" : "transparent",
          border: "none",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <Sun style={{ width: "14px", height: "14px" }} strokeWidth={1.5} />
        Light
      </button>
    </div>
  );
}
