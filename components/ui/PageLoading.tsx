/**
 * Placeholder shown until the account store has been hydrated from
 * localStorage. Rendering this instead of an error keeps the prerendered HTML
 * meaningful and avoids a hydration mismatch.
 */
export default function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="card card-pad">
        <div className="flex items-start gap-4">
          <div className="skeleton hidden h-11 w-11 rounded-xl sm:block" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-64" />
            <div className="skeleton h-3 w-52" />
          </div>
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card card-pad">
          <div className="space-y-3">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-4 w-72" />
          </div>
        </div>
      ))}
    </div>
  )
}
