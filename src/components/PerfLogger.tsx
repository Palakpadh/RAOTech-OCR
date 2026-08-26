"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    __raotechFetchPatched?: boolean;
    __raotechNavStart?: { href: string; startedAt: number };
  }
}

function log(event: string, meta?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_TRACE_LOGS === "0") return;
  if (meta) {
    console.log(`[trace][client] ${event}`, meta);
    return;
  }
  console.log(`[trace][client] ${event}`);
}

function now() {
  return performance.now();
}

function patchFetch() {
  if (window.__raotechFetchPatched) return;
  window.__raotechFetchPatched = true;

  const original = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const input = args[0];
    const requestInfo =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const start = now();
    log("fetch:start", { request: requestInfo });

    try {
      const response = await original(...args);

      log("fetch:done", {
        request: requestInfo,
        status: response.status,
        durationMs: Number((now() - start).toFixed(2)),
      });

      return response;
    } catch (error) {
      log("fetch:error", {
        request: requestInfo,
        durationMs: Number((now() - start).toFixed(2)),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  };
}

function installNavigationClickTracker() {
  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const href = anchor.getAttribute("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    window.__raotechNavStart = {
      href,
      startedAt: now(),
    };

    log("nav:click", { href });
  };

  document.addEventListener("click", onClick, true);

  return () => {
    document.removeEventListener("click", onClick, true);
  };
}

function PerfLoggerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string>("");

  useEffect(() => {
    patchFetch();

    const removeClickListener = installNavigationClickTracker();

    log("session:start", {
      userAgent: navigator.userAgent,
    });

    return removeClickListener;
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    const route = `${pathname}${query ? `?${query}` : ""}`;

    const previousRoute = previousRouteRef.current;

    if (!previousRoute) {
      previousRouteRef.current = route;
      log("route:loaded", { route });
      return;
    }

    const navStart = window.__raotechNavStart;

    const durationMs = navStart
      ? Number((now() - navStart.startedAt).toFixed(2))
      : null;

    log("route:changed", {
      from: previousRoute,
      to: route,
      clickHref: navStart?.href,
      durationMs,
    });

    previousRouteRef.current = route;
    window.__raotechNavStart = undefined;
  }, [pathname, searchParams]);

  return null;
}

export function PerfLogger() {
  return (
    <Suspense fallback={null}>
      <PerfLoggerInner />
    </Suspense>
  );
}