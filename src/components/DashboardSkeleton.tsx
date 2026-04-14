import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl border border-border/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function ChartSkeleton({ height = "h-[280px]" }: { height?: string }) {
  return (
    <div className="glass-card rounded-xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className={`w-full ${height} rounded-lg`} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 mt-6 animate-in fade-in duration-300">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* AI Insights + Lucky Game */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartSkeleton height="h-[160px]" />
        <ChartSkeleton height="h-[160px]" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
