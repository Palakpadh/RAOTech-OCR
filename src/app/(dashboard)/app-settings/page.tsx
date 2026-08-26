import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getActiveClient } from "@/lib/clientContext";
import { AppSettingsClient } from "./AppSettingsClient";

export default async function AppSettingsPage() {
  const ctx = await getActiveClient();
  if (!ctx) return redirect("/sign-in");

  const clerkUser = await currentUser();

  return (
    <AppSettingsClient
      userName={ctx.user.name || clerkUser?.firstName || "User"}
      userEmail={ctx.user.email}
      userImageUrl={clerkUser?.imageUrl ?? null}
      createdAt={clerkUser?.createdAt ? new Date(clerkUser.createdAt).toISOString() : null}
    />
  );
}
