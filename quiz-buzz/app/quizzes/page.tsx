import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CircleHelp } from "lucide-react";
import Link from "next/link";
import { QuizCard } from "@/components/QuizCard";
import { apiFetch, normalizeList } from "@/lib/api";
import { type ApiListResponse, type Quiz } from "@/lib/types";

async function getQuizzes(page = 1, limit = 12) {
  try {
    const response = await apiFetch<ApiListResponse<Quiz>>(
      `/quizzes?page=${page}&limit=${limit}`
    );
    return normalizeList(response);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return {
      docs: [],
      page: 1,
      limit: 12,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }
}

export const metadata = {
  title: "Browse Quizzes | QuizBuzz",
  description: "Browse and play community quizzes on QuizBuzz",
};

export const dynamic = "force-dynamic";

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { userId } = await auth();
  const page = parseInt(searchParams.page || "1", 10);
  const result = await getQuizzes(page);
  const quizzes = result.docs || [];

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-slate-200 bg-white py-8 sm:py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-slate-950">Browse Quizzes</h1>
          <p className="mt-2 text-slate-600">
            Discover and play quizzes from our community
          </p>
        </div>
      </section>

      <section className="flex-1 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {userId ? (
            <div className="mb-8 rounded-lg border border-indigo-200 bg-indigo-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Ready to publish a quiz?</h2>
                  <p className="mt-1 text-sm text-slate-600">Create a new quiz and share it with players.</p>
                </div>
                <Link
                  href="/quizzes/create"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create Quiz
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : null}

          {quizzes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz: Quiz) => (
                  <QuizCard key={quiz._id} quiz={quiz} />
                ))}
              </div>

              {result.total > result.limit ? (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/quizzes?page=${page - 1}`}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  )}

                  <span className="text-sm text-slate-600">
                    Page {page} of {result.pages}
                  </span>

                  {page < result.pages ? (
                    <Link
                      href={`/quizzes?page=${page + 1}`}
                      className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
              <CircleHelp className="mx-auto size-12 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                No quizzes available
              </h2>
              <p className="mt-2 text-slate-600">
                Be the first to create a quiz!
              </p>
              <Link
                href="/quizzes/create"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create Quiz
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
