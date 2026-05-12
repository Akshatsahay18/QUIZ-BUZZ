import { auth } from "@clerk/nextjs/server";
import { QuizPlayer } from "@/components/QuizPlayer";
import { apiFetch, normalizeSingle } from "@/lib/api";
import { type ApiSingleResponse, type Quiz } from "@/lib/types";
import { notFound } from "next/navigation";

async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    const response = await apiFetch<ApiSingleResponse<Quiz>>(`/quizzes/${id}`);
    return normalizeSingle(response);
  } catch (error) {
    console.error("Error fetching quiz:", error);
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
    title: `${quiz.title} | QuizBuzz`,
    description: quiz.description || "Take this quiz on QuizBuzz",
  };
}

export default async function PlayQuizPage({
  params,
}: {
  params: { id: string };
}) {
  await auth();
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <QuizPlayer quiz={quiz} />
    </div>
  );
}
