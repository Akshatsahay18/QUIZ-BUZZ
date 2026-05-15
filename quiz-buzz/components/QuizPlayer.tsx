"use client";
/* eslint-disable @next/next/no-img-element */

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Quiz } from "@/lib/types";
import { Timer } from "./Timer";

interface QuizPlayerProps {
  quiz: Quiz;
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(quiz.timer > 0);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isAnswered = selectedAnswers[currentQuestionIndex] !== null;

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/quizzes/${quiz._id}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("No Clerk session token available.");
      }

      const response = await fetch("/api/v1/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: quiz._id,
          answers: selectedAnswers.map((answer) => answer ?? -1),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const data = await response.json();
      toast.success("Quiz submitted successfully.");
      router.push(`/quizzes/${quiz._id}/results?attemptId=${data.data._id}`);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    setShowTimer(false);
    handleSubmit();
  };

  const progressPercentage =
    ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-950">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-slate-600">{quiz.description}</p>
        )}
      </div>

      {/* Timer and Progress */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>
        {showTimer && (
          <Timer
            initialSeconds={quiz.timer}
            onExpire={handleTimerExpire}
          />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>

      {/* Dots overview */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {quiz.questions.map((_, idx) => {
          const visited = selectedAnswers[idx] !== null;
          const isCurrent = idx === currentQuestionIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                if (visited || isCurrent) setCurrentQuestionIndex(idx);
              }}
              aria-label={`Question ${idx + 1}`}
              className={`h-3 w-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                isCurrent
                  ? "bg-indigo-600 scale-110"
                  : visited
                  ? "bg-indigo-400"
                  : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>

      {/* Question */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">
          {currentQuestion.question}
        </h2>

        {currentQuestion.image ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img
              src={currentQuestion.image}
              alt={`Illustration for question ${currentQuestionIndex + 1}`}
              className="max-h-80 w-full object-cover"
            />
          </div>
        ) : null}

        {/* Options */}
        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              className={`w-full rounded-lg border-2 p-4 text-left transition ${
                selectedAnswers[currentQuestionIndex] === index
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-6 items-center justify-center rounded-full border-2 font-semibold ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="font-medium text-slate-950">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation and Submit */}
      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex-1" />

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedAnswers.some((a) => a === null)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-6 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              "Submit Quiz"
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="rounded-md bg-indigo-600 px-6 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>

      {/* Sign In Prompt */}
      {!isSignedIn && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Sign in to save your quiz attempt and view your results.
          </p>
          <SignInButton mode="modal">
            <button className="mt-3 inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
              Sign In
            </button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
