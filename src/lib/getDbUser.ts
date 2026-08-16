import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, TTL } from "@/lib/serverCache";

export const userCacheKey = (clerkId: string) => `user:${clerkId}`;

/**
 * Resolve the database User for the current Clerk session, creating it on first
 * use (keyed by email, matching the dashboard/save flows). Returns null when
 * unauthenticated.
 *
 * Memoised per request: a single page render calls this several times (directly
 * and via getActiveClient), and each call used to cost a Clerk API round trip
 * plus a write to Postgres.
 */
export const getDbUser = cache(async () => {
  // auth() decodes the session cookie locally — no network call, unlike
  // currentUser(), which hits Clerk's API every time.
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Warm instance: no round trip at all.
  const cached = cacheGet<User>(userCacheKey(clerkId));
  if (cached) return cached;

  // Hot path: one indexed read, no write.
  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return cacheSet(userCacheKey(clerkId), existing, TTL.user);

  // Cold path: first sign-in, or a row created before clerkId was recorded.
  const user = await currentUser();
  if (!user) return null;
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const created = await prisma.user.upsert({
    where: { email },
    update: {
      // Backfill clerkId so subsequent requests take the hot path above.
      clerkId: user.id,
      name: user.firstName || user.username || undefined,
    },
    create: {
      clerkId: user.id,
      email,
      name: user.firstName || user.username || "User",
    },
  });

  return cacheSet(userCacheKey(clerkId), created, TTL.user);
});
