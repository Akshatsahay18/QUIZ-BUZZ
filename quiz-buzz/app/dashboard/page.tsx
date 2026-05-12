import { auth } from "@clerk/nextjs/server";
import { ArrowRight, BarChart3, Clock3, ListChecks, Plus, Target } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiFetch, normalizeList, normalizeSingle } from "@/lib/api";
import { type ApiListResponse, type ApiSingleResponse, type Attempt, type Quiz } from "@/lib/types";

export const metadata = {
  title: "Dashboard | QuizBuzz",
  description: "View your quizzes, recent attempts, and performance stats.",
};

async function getCreatedQuizzes(userId: string, token: string | null) {
  const response = await apiFetch<ApiListResponse<Quiz>>(
    `/quizzes?createdBy=${userId}&limit=50`,
    undefined,
    token ?? undefined
  );
  return normalizeList(response).docs;
}

async function getUserAttempts(userId: string, token: string | null) {
  const response = await apiFetch<ApiListResponse<Attempt>>(
    `/attempts?userId=${userId}&sort=-completedAt&limit=10`,
    undefined,
    token ?? undefined
  );
  return normalizeList(response).docs;
}

async function getQuizById(quizId: string) {
  const response = await apiFetch<ApiSingleResponse<Quiz>>(`/quizzes/${quizId}`);
  return normalizeSingle(response);
}

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const token = await getToken();

  if (!token) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const [createdQuizzes, userAttempts] = await Promise.all([
    getCreatedQuizzes(userId, token),
    getUserAttempts(userId, token),
  ]);

  const attemptQuizIds = Array.from(new Set(userAttempts.map((attempt) => attempt.quizId)));
  const relatedQuizzes = await Promise.all(
    attemptQuizIds.map(async (quizId) => {
      const quiz = await getQuizById(quizId);
      return quiz ? [quizId, quiz] as const : null;
    })
  );

  const quizEntries: Array<readonly [string, Quiz]> = createdQuizzes.map((quiz) => [quiz._id, quiz] as const);
  relatedQuizzes.forEach((entry) => {
    if (entry) {
      quizEntries.push(entry);
    }
  });

  const quizMap = new Map<string, Quiz>(quizEntries);

  const scoredAttempts = userAttempts.map((attempt) => {
    const quiz = quizMap.get(attempt.quizId);
    const totalQuestions = quiz?.questions.length ?? 0;
    const percentage = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;

    return {
      ...attempt,
      quizTitle: quiz?.title ?? "Unknown quiz",
      totalQuestions,
      percentage,
    };
  });

  const averageScore = scoredAttempts.length
    ? Math.round(scoredAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / scoredAttempts.length)
    : 0;

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Dashboard</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">Your quiz workspace</h1>
              <p className="mt-2 text-slate-600">Track your quizzes, attempts, and performance in one place.</p>
            </div>
            <Link href="/quizzes/create" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Plus className="size-4" aria-hidden="true" />
              Create New Quiz
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Quizzes Created</p>
                <ListChecks className="size-5 text-indigo-600" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{createdQuizzes.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total Attempts</p>
                <Target className="size-5 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{userAttempts.length}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Avg. Score</p>
                <BarChart3 className="size-5 text-amber-600" aria-hidden="true" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{averageScore}%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">My Quizzes</h2>
                <p className="mt-1 text-sm text-slate-600">All quizzes created by your account.</p>
              </div>
              <Link href="/quizzes/create" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Create New Quiz</Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Quiz</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Timer</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  {createdQuizzes.length > 0 ? createdQuizzes.map((quiz) => (
                    <tr key={quiz._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{quiz.title}</div>
                        <div className="mt-1 line-clamp-1 text-slate-500">{quiz.description || "No description"}</div>
                      </td>
                      <td className="px-4 py-4">{quiz.questions.length}</td>
                      <td className="px-4 py-4">{quiz.timer > 0 ? `${quiz.timer}s` : "No timer"}</td>
                      <td className="px-4 py-4">
                        <Link href={`/quizzes/${quiz._id}`} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">
                          Open
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>You have not created any quizzes yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Recent Attempts</h2>
                <p className="mt-1 text-sm text-slate-600">Your latest quiz completions and scores.</p>
              </div>
              <Clock3 className="size-5 text-indigo-600" aria-hidden="true" />
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Quiz</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Completed</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
                  {scoredAttempts.length > 0 ? scoredAttempts.map((attempt) => (
                    <tr key={attempt._id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-950">{attempt.quizTitle}</div>
                        <div className="mt-1 text-slate-500">{attempt.totalQuestions} questions</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{attempt.percentage}%</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{new Date(attempt.completedAt).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <Link href={`/quizzes/${attempt.quizId}/results?attemptId=${attempt._id}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                          Review
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>No attempts yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}