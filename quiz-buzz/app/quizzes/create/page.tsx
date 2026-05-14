"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import QuestionCard from "@/components/QuestionCard";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { type QuizCreatePayload, type QuizQuestion, type ApiSingleResponse } from "@/lib/types";

type Step = 1 | 2 | 3;

type OptionItem = { id: string; text: string };

type BuilderQuestion = {
  id: string;
  question: string;
  options: OptionItem[];
  correctOptionId?: string | null;
};

export default function CreateQuizPage() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const idCounter = useRef(1);

  const makeId = (prefix = "id") => `${prefix}_${idCounter.current++}`;

  const createQuestion = (): BuilderQuestion => ({
    id: makeId("q"),
    question: "",
    options: [0, 1, 2, 3].map(() => ({ id: makeId("o"), text: "" })),
    correctOptionId: null
  });
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timer, setTimer] = useState("30");
  const [questions, setQuestions] = useState<BuilderQuestion[]>([createQuestion()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => {
    const step1Valid = title.trim().length > 0 && description.trim().length > 0 && Number(timer) >= 0;

    const questionValidities = questions.map((q) => {
      const qErrors: { question?: string; options?: (string | null)[]; correctOption?: string | null } = {};
      if (q.question.trim().length === 0) qErrors.question = "Question text is required.";
      // options validation: collect option errors but only attach if any present
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        qErrors.options = new Array(4).fill("There must be exactly 4 options.");
      } else {
        const optionErrors = q.options.map((opt) => (opt.text.trim().length === 0 ? "Option is required." : null));
        const hasOptionError = optionErrors.some((e) => e !== null);
        if (hasOptionError) qErrors.options = optionErrors;
      }
      if (!q.correctOptionId) qErrors.correctOption = "Select the correct answer.";
      return qErrors;
    });

    const step2Valid = questionValidities.every((errs) => Object.keys(errs).length === 0);

    return { step1Valid, step2Valid, questionValidities };
  }, [description, questions, title, timer]);

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        return { ...question, [field]: value } as unknown as BuilderQuestion;
      })
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        const nextOptions = question.options.map((o, i) => (i === optionIndex ? { ...o, text: value } : o));
        return { ...question, options: nextOptions };
      })
    );
  };

  const addQuestion = () => {
    const q = createQuestion();
    setQuestions((currentQuestions) => {
      const next = [...currentQuestions, q];
      return next;
    });

    // scroll into view after next paint
    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector(`[data-qid="${q.id}"]`);
      if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
        (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
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

  // remove generic error banner; show inline errors instead

  const removeQuestion = (index: number) => {
    setQuestions((currentQuestions) => {
      if (currentQuestions.length === 1) {
        return currentQuestions;
      }

      return currentQuestions.filter((_, questionIndex) => questionIndex !== index);
    });
  };

  const goNext = () => {
    // clear previous field errors
    setFieldErrors({});

    if (step === 1) {
      if (!validation.step1Valid) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validation.questionValidities) {
        return;
      }

      // collect errors
      const errs: Record<string, any> = {};
      validation.questionValidities.forEach((qe: any, idx: number) => {
        if (Object.keys(qe).length > 0) {
          errs[questions[idx].id] = qe;
        }
      });

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }

      // If there were validation errors, focus first invalid question
      if (Object.keys(errs).length > 0) {
        const firstErrId = Object.keys(errs)[0];
        setTimeout(() => {
          const container = containerRef.current;
          if (!container) return;
          const el = container.querySelector(`[data-qid="${firstErrId}"]`);
          if (el) {
            (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
            const input = el.querySelector<HTMLInputElement>("input[aria-label^='Question']");
            input?.focus();
          }
        }, 50);
      }

      setStep(3);
    }
  };

  const isNextDisabled = (() => {
    if (step === 1) return !validation.step1Valid;
    if (step === 2) return !validation.step2Valid;
    return false;
  })();

  const goBack = () => {
    setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as Step) : 1));
  };

  const handleSubmit = async () => {
    if (!validation.step1Valid || !validation.step2Valid) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/quizzes/create");
      return;
    }

    const token = await getToken();
    if (!token) {
      toast.error("Unable to create the quiz because your session token is missing.");
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
          options: question.options.map((option) => option.text.trim()),
          correctAnswer: Math.max(0, question.options.findIndex((o) => o.id === question.correctOptionId)),
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
        {/* inline validation messages handled per-field; no generic banner */}

        {step === 1 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Quiz details</h2>
            <p className="mt-1 text-sm text-slate-600">Add the basics before writing questions.</p>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Marvel Movie Trivia" className={`h-11 rounded-md border px-3 outline-none ring-0 focus:border-indigo-400 ${step === 1 && title.trim().length === 0 && !validation.step1Valid ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && title.trim().length === 0 && !validation.step1Valid ? <span className="text-xs text-rose-600">Title is required.</span> : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short summary shown on quiz cards" rows={5} className={`rounded-md border px-3 py-2 outline-none focus:border-indigo-400 ${step === 1 && description.trim().length === 0 && !validation.step1Valid ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && description.trim().length === 0 && !validation.step1Valid ? <span className="text-xs text-rose-600">Description is required.</span> : null}
              </label>

              <label className="grid gap-2 max-w-sm">
                <span className="text-sm font-medium text-slate-700">Timer (seconds)</span>
                <input type="number" min="0" value={timer} onChange={(event) => setTimer(event.target.value)} className={`h-11 rounded-md border px-3 outline-none focus:border-indigo-400 ${step === 1 && Number(timer) < 0 && !validation.step1Valid ? "border-rose-400" : "border-slate-300"}`} />
                {step === 1 && Number(timer) < 0 && !validation.step1Valid ? <span className="text-xs text-rose-600">Timer must be zero or more.</span> : null}
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

            <div className="mt-6" ref={containerRef}>
              <div className="space-y-6">
                {questions.map((question, questionIndex) => (
                  <div key={question.id} data-qid={question.id}>
                    <QuestionCard
                      question={question}
                      index={questionIndex}
                      errors={fieldErrors[question.id]}
                      onChange={(q) => setQuestions((current) => current.map((c) => (c.id === q.id ? q : c)))}
                      onRemove={() => removeQuestion(questionIndex)}
                      onMoveUp={() => moveQuestion(questionIndex, -1)}
                      onMoveDown={() => moveQuestion(questionIndex, 1)}
                      disableRemove={questions.length === 1}
                    />
                  </div>
                ))}
              </div>
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
                  <p className="mt-2 text-sm text-slate-600">Correct answer: {(() => {
                    const idx = question.options.findIndex((o) => o.id === question.correctOptionId);
                    return idx >= 0 ? String(idx + 1) : "N/A";
                  })()}</p>
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
              <button type="button" onClick={goNext} disabled={isNextDisabled} title={isNextDisabled ? "Complete required fields before continuing" : undefined} className={`inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold transition ${isNextDisabled ? "bg-slate-400 text-white cursor-not-allowed" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
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