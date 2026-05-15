import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { apiFetch, normalizeList } from "@/lib/api";
import { type ApiListResponse, type Quiz } from "@/lib/types";

export const metadata = {
  title: "Leaderboard | QuizBuzz",
  description: "Browse quiz leaderboards and view top attempts.",
};

async function getQuizzes() {
  const response = await apiFetch<ApiListResponse<Quiz>>("/quizzes?limit=12");
  return normalizeList(response).docs;
}

export default async function LeaderboardIndexPage() {
  const quizzes = await getQuizzes();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              <Trophy className="size-4" aria-hidden="true" />
              Leaderboards
            </div>
            <h1 className="mt-5 text-4xl font-semibold text-slate-950">Select a quiz leaderboard</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">Choose a quiz below to see the top attempts and current rankings.</p>
          </div>
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-950">{quiz.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{quiz.description || "No description provided."}</p>
                <div className="mt-4 text-sm text-slate-500">{quiz.questionCount ?? quiz.questions.length} questions</div>
                <Link href={`/leaderboard/${quiz._id}`} className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  View leaderboard
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
