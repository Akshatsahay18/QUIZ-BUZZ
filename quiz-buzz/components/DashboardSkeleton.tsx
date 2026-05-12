export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-64 rounded bg-slate-200" />
            <div className="mt-6 h-56 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}