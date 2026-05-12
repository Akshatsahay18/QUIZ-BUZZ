import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-950">
          <SearchX className="size-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quiz not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          We could not find that quiz.
        </h1>
        <p className="mt-4 text-slate-600">
          The link may be broken or the quiz may have been removed.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/quizzes"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to quizzes
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}