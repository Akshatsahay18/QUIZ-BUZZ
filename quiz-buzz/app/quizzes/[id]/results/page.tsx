import { auth } from "@clerk/nextjs/server";
import { CheckCircle, XCircle, Trophy, Home } from "lucide-react";
import Link from "next/link";
import { apiFetch, normalizeSingle } from "@/lib/api";
import { type ApiSingleResponse, type Attempt, type Quiz } from "@/lib/types";
import { redirect } from "next/navigation";

async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    const response = await apiFetch<ApiSingleResponse<Quiz>>(`/quizzes/${id}`);
    return normalizeSingle(response);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
}

async function getAttempt(attemptId: string, token?: string | null): Promise<Attempt | null> {
  try {
    const response = await apiFetch<ApiSingleResponse<Attempt>>(
      `/attempts/${attemptId}`,
      undefined,
      token ?? undefined
    );
    return normalizeSingle(response);
  } catch (error) {
    console.error("Error fetching attempt:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    return {
      title: "Quiz Not Found | QuizBuzz",
    };
  }

  return {
    title: `Results - ${quiz.title} | QuizBuzz`,
    description: `View your results for ${quiz.title}`,
  };
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { attemptId?: string };
}) {
  const { getToken } = await auth();
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    redirect("/quizzes");
  }

  let attempt: Attempt | null = null;
  if (searchParams.attemptId) {
    const token = await getToken();
    attempt = await getAttempt(searchParams.attemptId, token);
  }

  if (!attempt) {
    redirect(`/quizzes/${params.id}`);
  }

  const totalQuestions = quiz.questions.length;
  const correctCount = attempt.score;
  const wrongCount = Math.max(totalQuestions - correctCount, 0);
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = percentage >= 60;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        {/* Score Card */}
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center">
          <div className="flex justify-center mb-6">
            {isPassed ? (
              <Trophy className="size-16 text-amber-500" aria-hidden="true" />
            ) : (
              <CheckCircle className="size-16 text-indigo-600" aria-hidden="true" />
            )}
          </div>

          <h1 className="text-4xl font-bold text-slate-950">
            {percentage}%
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            You scored {correctCount} out of {totalQuestions}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Correct</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">{correctCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Wrong</p>
              <p className="mt-2 text-2xl font-semibold text-rose-600">{wrongCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Questions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{totalQuestions}</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-white p-4 border border-slate-200">
            <p className="text-sm text-slate-600">Performance</p>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  isPassed ? "bg-emerald-500" : "bg-blue-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {isPassed ? (
            <p className="mt-6 text-lg font-semibold text-emerald-600">
              ✓ Great job! You passed!
            </p>
          ) : (
            <p className="mt-6 text-lg font-semibold text-slate-600">
              Keep practicing!
            </p>
          )}
        </div>

        {/* Review Section */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Review Your Answers</h2>
          <div className="mt-4 space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = attempt.answers[index];
              const correctAnswerIndexes = attempt.correctAnswers?.[index] ?? [];
              const userAnswerIndexes = Array.isArray(userAnswer) ? userAnswer : [];
              const isCorrect =
                userAnswerIndexes.length === correctAnswerIndexes.length &&
                [...userAnswerIndexes].sort((a, b) => a - b).every((value, answerIndex) => value === [...correctAnswerIndexes].sort((a, b) => a - b)[answerIndex]);
              const userAnswerLabel =
                userAnswerIndexes.length > 0
                  ? userAnswerIndexes.map((answerIndex) => question.options[answerIndex]).join(", ")
                  : "Not answered";
              const correctAnswerLabel =
                correctAnswerIndexes.length > 0
                  ? correctAnswerIndexes.map((answerIndex) => question.options[answerIndex]).join(", ")
                  : "Not available";

              return (
                <div
                  key={index}
                  className={`rounded-lg border-2 p-4 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="mt-0.5 size-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 text-red-600 flex-shrink-0" aria-hidden="true" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-950">
                        Question {index + 1}: {question.question}
                      </p>
                      <p className={`mt-2 text-sm ${
                        isCorrect ? "text-emerald-700" : "text-red-700"
                      }`}>
                        Your answers: {userAnswerLabel}
                      </p>
                      {!isCorrect && (
                        <p className="mt-1 text-sm text-emerald-700">
                          Correct answers: {correctAnswerLabel}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/quizzes"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Home className="size-5" aria-hidden="true" />
            Back to Quizzes
          </Link>
          <Link
            href={`/quizzes/${params.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Retake Quiz
          </Link>
          <Link
            href={`/leaderboard/${params.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
