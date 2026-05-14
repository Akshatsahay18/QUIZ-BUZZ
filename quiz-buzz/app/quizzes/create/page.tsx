"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { type QuizCreatePayload, type QuizQuestion, type ApiSingleResponse } from "@/lib/types";

type Step = 1 | 2 | 3;

const createQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
});

export default function CreateQuizPage() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timer, setTimer] = useState("30");
  const [questions, setQuestions] = useState<QuizQuestion[]>([createQuestion()]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => {
    const step1Valid = title.trim().length > 0 && description.trim().length > 0 && Number(timer) >= 0;
    const step2Valid = questions.length > 0 && questions.every((question) => {
      return (
        question.question.trim().length > 0 &&
        question.options.length === 4 &&
        question.options.every((option) => option.trim().length > 0)
      );
    });

    return { step1Valid, step2Valid };
  }, [description, questions, title, timer]);

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question;
        }

        return {
          ...question,
          [field]: value,
        } as QuizQuestion;
      })
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;

        return {
          ...question,
          options: nextOptions,
        };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((currentQuestions) => [...currentQuestions, createQuestion()]);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    setQuestions((currentQuestions) => {
      const next = [...currentQuestions];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return next;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      return next;
    });
  };

  const [collapsed, setCollapsed] = useState<boolean[]>(() => questions.map(() => false));

  useEffect(() => {
    setCollapsed((current) => {
      const next = [...current];
      // expand or trim to match questions length
      while (next.length < questions.length) next.push(false);
      if (next.length > questions.length) next.length = questions.length;
      return next;
    });
  }, [questions.length]);

  const toggleCollapsed = (index: number) => {
    setCollapsed((c) => {
      const n = [...c];
      n[index] = !n[index];
      return n;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((currentQuestions) => {
      if (currentQuestions.length === 1) {
        return currentQuestions;
      }

      return currentQuestions.filter((_, questionIndex) => questionIndex !== index);
    });
  };

  const goNext = () => {
    setError("");

    if (step === 1 && !validation.step1Valid) {
      setError("Please complete the quiz details before continuing.");
      return;
    }

    if (step === 2 && !validation.step2Valid) {
      setError("Please complete every question and all four options.");
      return;
    }

    setStep((currentStep) => (currentStep < 3 ? ((currentStep + 1) as Step) : 3));
  };

  const goBack = () => {
    setError("");
    setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as Step) : 1));
  };

  const handleSubmit = async () => {
    setError("");

    if (!validation.step1Valid || !validation.step2Valid) {
      setError("Please complete all required fields.");
      return;
    }

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/quizzes/create");
      return;
    }

    const token = await getToken();
    if (!token) {
      setError("Unable to create the quiz because your session token is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: QuizCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        timer: Number(timer),
        questions: questions.map((question) => ({
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correctAnswer: question.correctAnswer,
        })),
      };

      await apiFetch<ApiSingleResponse<unknown>>("/quizzes", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token);

      toast.success("Quiz created successfully.");
      router.push("/dashboard");
    } catch (submitError) {
      console.error("Failed to create quiz:", submitError);
      const message = "Unable to create quiz right now. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Create Quiz</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">Build a new quiz</h1>
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Details", "Questions", "Review"].map((label, index) => {
              const currentStep = (index + 1) as Step;
              const isActive = step === currentStep;
              const isComplete = step > currentStep;

              return (
                <div key={label} className={`rounded-lg border px-4 py-3 ${isActive ? "border-indigo-300 bg-indigo-50" : isComplete ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
                  <p className="mt-1 font-medium text-slate-950">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Quiz details</h2>
            <p className="mt-1 text-sm text-slate-600">Add the basics before writing questions.</p>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Marvel Movie Trivia" className={`h-11 rounded-md border px-3 outline-none ring-0 focus:border-indigo-400 ${step === 1 && title.trim().length === 0 && error ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && title.trim().length === 0 && error ? <span className="text-xs text-rose-600">Title is required.</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short summary shown on quiz cards" rows={5} className={`rounded-md border px-3 py-2 outline-none focus:border-indigo-400 ${step === 1 && description.trim().length === 0 && error ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && description.trim().length === 0 && error ? <span className="text-xs text-rose-600">Description is required.</span> : null}
              </label>

              <label className="grid gap-2 max-w-sm">
                <span className="text-sm font-medium text-slate-700">Timer (seconds)</span>
                <input type="number" min="0" value={timer} onChange={(event) => setTimer(event.target.value)} className={`h-11 rounded-md border px-3 outline-none focus:border-indigo-400 ${step === 1 && Number(timer) < 0 && error ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && Number(timer) < 0 && error ? <span className="text-xs text-rose-600">Timer must be zero or more.</span> : null}
              </label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Questions</h2>
                <p className="mt-1 text-sm text-slate-600">Add at least one question with four options.</p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{questions.length} question{questions.length === 1 ? "" : "s"} added</span>
                </div>
              </div>
              <button type="button" onClick={addQuestion} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                <Plus className="size-4" aria-hidden="true" />
                Add question
              </button>
            </div>

            <div className="mt-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">Questions editor placeholder</div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Review quiz</h2>
            <p className="mt-1 text-sm text-slate-600">Check everything before you publish.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Title</p>
                <p className="mt-2 font-semibold text-slate-950">{title || "Untitled"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Timer</p>
                <p className="mt-2 font-semibold text-slate-950">{timer} seconds</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Questions</p>
                <p className="mt-2 font-semibold text-slate-950">{questions.length}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">Q{index + 1}. {question.question || "Missing question text"}</p>
                  <p className="mt-2 text-sm text-slate-600">Correct answer: {question.correctAnswer + 1}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={goBack} disabled={step === 1} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Publish Quiz
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}