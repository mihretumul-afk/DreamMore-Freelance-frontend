/**
 * Skeleton placeholder that mirrors JobCard's layout while jobs load.
 */
export default function JobCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card border border-gray-200 bg-white p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 h-3.5 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
        <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
        <div className="h-6 w-16 animate-pulse rounded-md bg-gray-100" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
