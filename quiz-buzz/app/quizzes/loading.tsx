import { QuizCardSkeleton } from "@/components/QuizCardSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-slate-200 bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-5 w-96 animate-pulse rounded bg-slate-200" />
        </div>
      </section>

      <section className="flex-1 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <QuizCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
