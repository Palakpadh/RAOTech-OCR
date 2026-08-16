import { Skeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/Skeleton";

/**
 * Shown the instant a sidebar link is clicked, while the server renders the
 * page. Without a loading.tsx the App Router has no static shell to prefetch,
 * so every navigation blocked on the server with no visual feedback at all.
 */
export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <PageHeaderSkeleton />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] w-full" />
        ))}
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
