"use client";

import { ArrowRight, BookOpen, Timer } from "lucide-react";
import Link from "next/link";
import { secondsToMinutes } from "@/lib/time";
import { Quiz } from "@/lib/types";

interface QuizCardProps {
  quiz: Quiz;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const descriptionLines = quiz.description.split("\n");
  const truncatedDescription =
    descriptionLines.slice(0, 2).join("\n").substring(0, 100) +
    (quiz.description.length > 100 ? "..." : "");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 transition hover:shadow-md">
      <div>
        <h3 className="font-semibold text-slate-950">{quiz.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {truncatedDescription || "No description"}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <BookOpen className="size-4" aria-hidden="true" />
          <span>{(quiz.questionCount ?? quiz.questions.length) || 0} {((quiz.questionCount ?? quiz.questions.length) || 0) === 1 ? "Question" : "Questions"}</span>
        </div>
        {quiz.timer > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
            <Timer className="size-3" aria-hidden="true" />
            <span>
              {secondsToMinutes(quiz.timer)}{" "}
              {secondsToMinutes(quiz.timer) === 1 ? "min" : "mins"} timer
            </span>
          </div>
        )}
      </div>

      <Link
        href={`/quizzes/${quiz._id}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 mt-auto"
      >
        Play Now
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
