import { auth } from "@clerk/nextjs/server";
import { Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, normalizeList, normalizeSingle } from "@/lib/api";
import { type ApiListResponse, type ApiSingleResponse, type Attempt, type Quiz } from "@/lib/types";

async function getQuiz(id: string): Promise<Quiz | null> {
  const response = await apiFetch<ApiSingleResponse<Quiz>>(`/quizzes/${id}`);
  return normalizeSingle(response);
}

async function getLeaderboard(id: string): Promise<Attempt[]> {
  const response = await apiFetch<ApiListResponse<Attempt>>(`/attempts?quizId=${id}&sort=-score&limit=10`);
  return normalizeList(response).docs;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    return { title: "Leaderboard | QuizBuzz" };
  }

  return {
    title: `${quiz.title} Leaderboard | QuizBuzz`,
    description: `Top attempts for ${quiz.title}`,
  };
}

export default async function LeaderboardPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  const attempts = await getLeaderboard(params.id);
  const rankedAttempts = [...attempts]
    .sort((left, right) => right.score - left.score || new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
    .slice(0, 10)
    .map((attempt, index) => ({ ...attempt, rank: index + 1 }));

  return (
    <div className="flex flex-1 flex-col bg-white">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-3 text-amber-700">
            <Trophy className="size-6" aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-wide">Leaderboard</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">{quiz.title}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">Top 10 attempts ranked by score.</p>
          <Link href={`/quizzes/${quiz._id}`} className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Play quiz
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
              {rankedAttempts.length > 0 ? rankedAttempts.map((attempt) => {
                const isCurrentUser = userId ? attempt.userId === userId : false;

                return (
                  <tr key={attempt._id} className={isCurrentUser ? "bg-indigo-50" : ""}>
                    <td className="px-4 py-4 font-semibold text-slate-950">#{attempt.rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Medal className="size-4 text-amber-500" aria-hidden="true" />
                        <span className="font-medium text-slate-950">{isCurrentUser ? "You" : attempt.userId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{attempt.score} pts</span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{new Date(attempt.completedAt).toLocaleString()}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>No leaderboard entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}