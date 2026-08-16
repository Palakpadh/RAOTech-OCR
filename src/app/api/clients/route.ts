import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser, userCacheKey } from "@/lib/getDbUser";
import {
  ACTIVE_CLIENT_COOKIE,
  ensureDefaultClient,
  getActiveClient,
  clientListCacheKey,
  invalidateClientCaches,
} from "@/lib/clientContext";
import { seedLedgersForUser } from "@/lib/accounting/seedLedgers";
import { cacheGet, cacheSet, cacheDelete, TTL } from "@/lib/serverCache";

// ClientSwitcher calls this on every page load. It used to run the full
// user + workspace bootstrap three times over (getDbUser, listClientsForUser,
// then getActiveClient, which repeats both). getActiveClient already guarantees
// a workspace exists, so one call plus the list is enough.
export async function GET() {
  try {
    const ctx = await getActiveClient();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ClientSwitcher mounts on every page load, so this list is served from
    // the in-process cache and invalidated explicitly when a client is created.
    const listKey = clientListCacheKey(ctx.user.id);
    const clients =
      cacheGet<typeof ctx.client[]>(listKey) ??
      cacheSet(
        listKey,
        await prisma.client.findMany({
          where: { userId: ctx.user.id },
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        }),
        TTL.clientList
      );

    return NextResponse.json({
      clients,
      activeClientId: ctx.client.id,
    });
  } catch (error) {
    console.error("[CLIENTS_GET]", error);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    await ensureDefaultClient(user.id);

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name,
        gstin: body.gstin || null,
        pan: body.pan || null,
        address: body.address || null,
        email: body.email || null,
        phone: body.phone || null,
        tallyCompany: body.tallyCompany || null,
        isDefault: false,
      },
    });

    await seedLedgersForUser(prisma, user.id, client.id);
    invalidateClientCaches(user.id);

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error("[CLIENTS_POST]", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A client with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

/** PATCH: switch active client { clientId } */
export async function PATCH(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const clientId = String(body.clientId ?? "");
    const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: user.id },
      data: { activeClientId: client.id },
    });
    // The cached user row still carries the old activeClientId.
    cacheDelete(userCacheKey(user.clerkId));

    const res = NextResponse.json({ activeClientId: client.id, client });
    res.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (error) {
    console.error("[CLIENTS_PATCH]", error);
    return NextResponse.json({ error: "Failed to switch client" }, { status: 500 });
  }
}
