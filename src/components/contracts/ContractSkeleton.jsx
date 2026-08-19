/**
 * Skeletons mirroring the contracts pages while real API data loads — never
 * displays fake zero values, "$0" amounts or placeholder contracts.
 */

/** Skeleton for the contracts list page. */
export function ContractListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-card border border-gray-200 bg-white p-5 shadow-card"
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the contract details page. */
export function ContractDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 max-w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-28 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
          <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
        </div>
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
          <div className="h-28 animate-pulse rounded-card border border-gray-200 bg-white p-6 shadow-card" />
        </div>
      </div>
    </div>
  );
}
