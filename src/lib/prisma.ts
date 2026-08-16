import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Set PRISMA_LOG_QUERIES=1 to print every query with its duration and a running
 * total. Round trips are the dominant cost on this app (the Supabase pooler is
 * in ap-northeast-2, ~290ms per query from here), so the query *count* for a
 * page load is the number worth watching — a page that suddenly issues ten
 * queries instead of two has regressed by ~2 seconds.
 */
const LOG_QUERIES = process.env.PRISMA_LOG_QUERIES === "1";

function createClient() {
  if (!LOG_QUERIES) return new PrismaClient();

  const client = new PrismaClient({ log: [{ emit: "event", level: "query" }] });

  let count = 0;
  let totalMs = 0;
  client.$on("query", (e) => {
    count += 1;
    totalMs += e.duration;
    const q = e.query.replace(/\s+/g, " ").slice(0, 100);
    console.log(`[prisma] #${count} ${e.duration}ms (Σ ${totalMs}ms) ${q}`);
  });

  return client;
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
