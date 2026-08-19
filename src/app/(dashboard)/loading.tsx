import { Skeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/Skeleton";

/**
 * Shown the instant a sidebar link is clicked, while the server renders the
 * page. Without a loading.tsx the App Router has no static shell to prefetch,
 * so every navigation blocked on the server with no visual feedback at all.
 */
export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-7 space-y-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#2a2d35]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0f1115] h-[100px]" />
        ))}
      </div>

      <div className="border border-[#2a2d35] bg-[#0f1115] overflow-hidden">
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
