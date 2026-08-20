import { ToastProvider } from "@/components/Toast";
import { DashboardShell } from "./DashboardShell";
import { getActiveClient, listClientsForUser } from "@/lib/clientContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getActiveClient();
  let clients: Array<{ id: string; name: string; gstin: string | null; isDefault: boolean }> = [];
  let activeClientId: string | null = null;

  if (ctx) {
    activeClientId = ctx.client.id;
    const clientRows = await listClientsForUser(ctx.user.id);
    clients = clientRows.map((c) => ({
      id: c.id,
      name: c.name,
      gstin: c.gstin,
      isDefault: c.isDefault,
    }));
  }

  return (
    <ToastProvider>
      <DashboardShell initialClients={clients} initialActiveId={activeClientId}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
