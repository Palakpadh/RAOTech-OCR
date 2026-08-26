import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  LOCAL_ONLY_API_PREFIXES,
  LOCAL_ONLY_ROUTE_PREFIXES,
  extraPagesEnabled,
} from "@/lib/featureFlags";

// Define routes that are public (do not require login)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/intake(.*)",
]);

/**
 * The desktop connector's own endpoints. They authenticate with
 * `Authorization: Bearer rtc_…` against ConnectorDevice.tokenHash, not with a
 * Clerk session — the binary on the accountant's machine never holds a login,
 * which is what lets a device be revoked without disturbing the user's account.
 * Left inside Clerk's session requirement they would answer a redirect to the
 * sign-in page, which a Go agent reads as an unparseable 200.
 *
 * /api/connector/devices/* is deliberately absent: that is the web UI managing
 * its own devices and stays behind Clerk.
 */
const isConnectorRoute = createRouteMatcher([
  "/api/connector/pair",
  "/api/connector/heartbeat",
  "/api/connector/jobs",
  "/api/connector/jobs/(.*)",
]);

// Note: The function is now 'async' and we use 'await auth.protect()'
export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const allowExtraPages = extraPagesEnabled();
  if (!allowExtraPages) {
    const blockedApi = LOCAL_ONLY_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    if (blockedApi) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const blockedPage = LOCAL_ONLY_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    if (blockedPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (!isPublicRoute(req) && !isConnectorRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};