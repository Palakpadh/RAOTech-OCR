import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/billing/status
 *
 * Returns { premium: boolean } for the currently signed-in user.
 *
 * In a full implementation this would query the database for a verified
 * Razorpay payment record.  For now, we look for a "rao_premium" flag
 * stored in the user's Clerk publicMetadata (set by the checkout handler
 * on payment verification).
 *
 * If no payment record exists, the user is on the free tier.
 */
export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ premium: false }, { status: 401 });
    }

    // Check Clerk publicMetadata for premium flag
    // This is set by the checkout PUT handler after successful Razorpay verification
    const metadata = (sessionClaims as any)?.publicMetadata ?? {};
    const isPremium = !!metadata.rao_premium;

    return NextResponse.json({ premium: isPremium });
  } catch (error: any) {
    console.error("[Billing Status Error]:", error);
    return NextResponse.json({ premium: false });
  }
}
