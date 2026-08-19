/**
 * Skeleton mirroring the dashboard layout (welcome, stats, sections) while
 * real API data loads — never renders misleading zeros.
 */
export default function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      {/* Welcome */}
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white p-5 shadow-card" />
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="h-56 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
          <div className="h-56 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
        </div>
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
          <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
        </div>
      </div>
    </div>
  );
}
