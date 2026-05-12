export function QuizCardSkeleton() {
  return (
    <div className="flex h-full min-h-[220px] animate-pulse flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div className="h-5 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-11/12 rounded bg-slate-200" />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-7 w-24 rounded-full bg-slate-200" />
        <div className="h-7 w-20 rounded-full bg-slate-200" />
      </div>

      <div className="mt-auto h-10 rounded-md bg-slate-200" />
    </div>
  );
}