import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { seedLedgersForUser } from "@/lib/accounting/seedLedgers";

export const ACTIVE_CLIENT_COOKIE = "active_client_id";

/**
 * The legacy backfill and the ledger seed are one-time-per-user jobs, but they
 * used to run on every request — roughly eight round trips to Postgres before a
 * page could start loading its own data. Remember who has already been
 * bootstrapped in this process so the work runs at most once per server
 * instance. Both operations stay idempotent, so a cold start just repeats them
 * harmlessly.
 */
const bootstrapped = new Set<string>();
const BOOTSTRAP_MEMO_LIMIT = 5000;

function markBootstrapped(userId: string) {
  if (bootstrapped.size >= BOOTSTRAP_MEMO_LIMIT) bootstrapped.clear();
  bootstrapped.add(userId);
}

/** Move any pre-multi-client rows (clientId = "") into the workspace, then seed ledgers. */
async function backfillAndSeed(userId: string, clientId: string) {
  await Promise.all([
    prisma.ledger.updateMany({ where: { userId, clientId: "" }, data: { clientId } }).catch(() => null),
    prisma.ledgerMapping.updateMany({ where: { userId, clientId: "" }, data: { clientId } }).catch(() => null),
    prisma.mappingRule.updateMany({ where: { userId, clientId: "" }, data: { clientId } }).catch(() => null),
    prisma.voucher.updateMany({ where: { userId, clientId: "" }, data: { clientId } }).catch(() => null),
    prisma.bankStatement.updateMany({ where: { userId, clientId: "" }, data: { clientId } }).catch(() => null),
  ]);

  await seedLedgersForUser(prisma, userId, clientId);
}

/**
 * Ensure the user has at least one client workspace.
 * Existing unscoped data (legacy clientId="") is backfilled into the default client.
 */
export async function ensureDefaultClient(userId: string) {
  // One ordered query replaces the previous "find default, else find any" pair:
  // isDefault first, oldest as the tiebreak.
  let client = await prisma.client.findFirst({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const isNewWorkspace = !client;
  if (!client) {
    client = await prisma.client.create({
      data: {
        userId,
        name: "Default Client",
        isDefault: true,
      },
    });
  }

  if (isNewWorkspace || !bootstrapped.has(userId)) {
    markBootstrapped(userId);
    await backfillAndSeed(userId, client.id);

    // Conditional updateMany does in one round trip what a findUnique + update
    // pair used to do in two, and only writes when activeClientId is unset.
    await prisma.user.updateMany({
      where: { id: userId, activeClientId: null },
      data: { activeClientId: client.id },
    });
  }

  return client;
}

export async function listClientsForUser(userId: string) {
  await ensureDefaultClient(userId);
  return prisma.client.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * Resolve the active workspace for the signed-in user.
 *
 * Memoised per request — this is called by every dashboard page and API route,
 * often more than once in the same render.
 */
export const getActiveClient = cache(async () => {
  const cookieStore = await cookies();
  const cookieClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value;

  // Measured: each round trip to the Seoul pooler costs ~290ms, so the user
  // lookup and the workspace lookup are issued as one wave rather than in
  // sequence. The cookie already carries the workspace id, so the client row
  // can be fetched without waiting to learn the user's id — ownership is
  // verified below before the row is used for anything.
  const [user, cookieClient] = await Promise.all([
    getDbUser(),
    cookieClientId
      ? prisma.client.findUnique({ where: { id: cookieClientId } })
      : Promise.resolve(null),
  ]);

  if (!user) return null;

  let client = null as Awaited<ReturnType<typeof prisma.client.findFirst>>;

  // Only trust the speculatively-fetched row if it really belongs to this user.
  if (cookieClient && cookieClient.userId === user.id) {
    client = cookieClient;
  }

  if (!client && user.activeClientId && user.activeClientId !== cookieClientId) {
    client = await prisma.client.findFirst({
      where: { id: user.activeClientId, userId: user.id },
    });
  }

  // Cold path only: first visit, or a stale cookie pointing at a deleted client.
  if (!client) {
    client = await ensureDefaultClient(user.id);
  }

  if (!client) return null;

  if (user.activeClientId !== client.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeClientId: client.id },
    });
    // Keep the memoised user consistent with what we just wrote.
    user.activeClientId = client.id;
  }

  return { user, client };
});

export async function requireActiveClient() {
  const ctx = await getActiveClient();
  if (!ctx) throw new Error("Unauthorized");
  return ctx;
}
