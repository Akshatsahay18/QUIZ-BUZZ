export default function Loading() {
  return (
    <div className="flex flex-1 items-start justify-center bg-white px-4 py-10">
      <div className="w-full max-w-2xl animate-pulse">
        <div className="h-8 w-3/4 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full rounded bg-slate-200" />
        <div className="mt-8 h-3 w-full rounded-full bg-slate-200" />
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="h-6 w-1/2 rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-14 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}