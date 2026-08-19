/**
 * Skeleton mirroring a proposal list while real API data loads — never
 * displays fake zero values or placeholder proposals.
 */
export default function ProposalSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-card border border-gray-200 bg-white p-5 shadow-card"
          />
        ))}
      </div>
    </div>
  );
}
