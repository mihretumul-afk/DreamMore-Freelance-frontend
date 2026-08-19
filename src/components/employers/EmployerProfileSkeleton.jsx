/**
 * Skeleton placeholder mirroring the employer profile layout while the
 * profile loads.
 */
export default function EmployerProfileSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      {/* Header card */}
      <div className="rounded-card border border-gray-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
          <div className="w-full space-y-3">
            <div className="h-6 w-52 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
          <div className="h-32 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
          <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
        </div>
      </div>
    </div>
  );
}
