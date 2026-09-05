/**
 * Skeleton placeholder mirroring the freelancer profile layout while the
 * profile loads.
 */
export default function FreelancerProfileSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      {/* Page header */}
      <div>
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-8 w-44 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-gray-200" />
      </div>

      {/* Identity hero */}
      <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-card">
        <div className="bg-gradient-to-br from-brand-50/60 via-white to-indigo-50/40 px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div className="w-full space-y-3">
              <div className="mx-auto h-7 w-52 animate-pulse rounded bg-gray-200 sm:mx-0" />
              <div className="mx-auto h-5 w-80 max-w-full animate-pulse rounded bg-gray-200 sm:mx-0" />
              <div className="mx-auto flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-5 py-4 sm:px-8 sm:py-5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Body cards */}
      <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
      <div className="h-32 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
      <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
      <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white shadow-card" />
    </div>
  );
}
