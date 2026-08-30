"use client";

import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Full-page paywall overlay shown when a free-tier user tries to access
 * a premium feature (AI Assistant, Export Tally, Push to Tally).
 */
export function PremiumPaywall({ feature }: { feature: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[var(--spx-canvas)] text-[var(--spx-text)]">
      <div className="max-w-md w-full mx-auto p-8 text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <Lock className="h-7 w-7 text-amber-500" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Premium Feature
          </h2>
          <p className="text-sm text-[var(--spx-muted)]">
            <span className="font-semibold text-[var(--spx-text)]">{feature}</span>{" "}
            is available exclusively for paid subscribers.
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-[var(--spx-border)] bg-[var(--spx-card)] p-5 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--spx-muted)]">
            What you get
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "AI-powered invoice analysis & chat",
              "Export approved vouchers to Tally XML",
              "Push vouchers directly to TallyPrime",
              "Priority processing & support",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Button
          onClick={() => router.push("/pricing")}
          className="w-full rounded-xl bg-primary py-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Upgrade Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-[var(--spx-muted)]">
          Razorpay test mode · No real charges
        </p>
      </div>
    </div>
  );
}
