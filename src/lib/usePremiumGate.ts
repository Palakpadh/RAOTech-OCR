"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Lightweight hook that checks whether the current user has an active
 * premium subscription (i.e. a verified Razorpay payment).
 *
 * It calls GET /api/billing/status on mount.  The backend should return
 *   { premium: true }   – paid user
 *   { premium: false }  – free tier
 *
 * While the check is in flight, `loading` is true.
 *
 * If the backend is unreachable (no backend deployed, static export, etc.)
 * we default to `false` (free tier) so the paywall still shows.
 */
export function usePremiumStatus() {
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setPremium(!!data.premium);
        }
      } catch {
        // Backend unreachable — treat as free tier
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { premium, loading };
}
