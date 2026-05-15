"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import QuestionCard from "@/components/QuestionCard";
import { apiFetch } from "@/lib/api";
import {
  createBuilderQuestion,
  type BuilderQuestion,
  type QuestionErrors,
} from "@/lib/question-builder";
import {
  formatMinutesLabel,
  MAX_TIMER_MINUTES,
  MIN_TIMER_MINUTES,
  minutesToSeconds,
} from "@/lib/time";
import {
  type ApiSingleResponse,
  type QuizCreatePayload,
} from "@/lib/types";

type Step = 1 | 2 | 3;

const getTimerError = (value: string) => {
  if (value.trim() === "") {
    return "Timer is required.";
  }

  if (!/^\d+$/.test(value)) {
    return "Timer must be a whole number of minutes.";
  }

  const numericValue = Number(value);

  if (numericValue < MIN_TIMER_MINUTES) {
    return "Timer must be at least 1 minute.";
  }

  if (numericValue > MAX_TIMER_MINUTES) {
    return "Timer cannot exceed 180 minutes.";
  }

  return null;
};

const getQuestionErrors = (
  questions: BuilderQuestion[]
): Record<string, QuestionErrors> => {
  return questions.reduce<Record<string, QuestionErrors>>((acc, question) => {
    const errors: QuestionErrors = {};

    if (question.question.trim() === "") {
      errors.question = "Question text is required.";
    }

    const optionErrors = question.options.map((option) =>
      option.text.trim() === "" ? "Option is required." : null
    );

    if (optionErrors.some(Boolean)) {
      errors.options = optionErrors;
    }

    if (question.correctOptionIds.length < 1) {
      errors.correctOption = "Select at least one correct answer.";
    }

    if (question.correctOptionIds.length > 4) {
      errors.correctOption = "You can select at most four correct answers.";
    }

    if (question.isUploading) {
      errors.image = "Please wait for the image upload to finish.";
    }

    if (Object.keys(errors).length > 0) {
      acc[question.id] = errors;
    }

    return acc;
  }, {});
};

export default function CreateQuizPage() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const idCounter = useRef(6);
  const questionContainerRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("10");
  const [titleAttempted, setTitleAttempted] = useState(false);
  const [questionsAttempted, setQuestionsAttempted] = useState(false);
  const [questions, setQuestions] = useState<BuilderQuestion[]>(() => {
    let initialCounter = 1;
    const createInitialId = (prefix = "id") => `${prefix}_${initialCounter++}`;

    return [createBuilderQuestion(createInitialId)];
  });
  const [questionErrors, setQuestionErrors] = useState<
    Record<string, QuestionErrors>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const makeId = (prefix = "id") => `${prefix}_${idCounter.current++}`;

  const timerError = getTimerError(timerMinutes);
  const detailsValid =
    title.trim() !== "" && description.trim() !== "" && timerError === null;

  const updateQuestion = (questionId: string, nextQuestion: BuilderQuestion) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId ? nextQuestion : question
      )
    );
  };

  const scrollToQuestion = (questionId: string) => {
    const container = questionContainerRef.current;

    if (!container) {
      return;
    }

    const target = container.querySelector<HTMLElement>(
      `[data-qid="${questionId}"]`
    );

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const addQuestion = () => {
    const nextQuestion = createBuilderQuestion(makeId);

    setQuestions((currentQuestions) => [...currentQuestions, nextQuestion]);

    requestAnimationFrame(() => {
      scrollToQuestion(nextQuestion.id);
    });
  };

  const removeQuestion = (questionIndex: number) => {
    setQuestions((currentQuestions) => {
      if (currentQuestions.length === 1) {
        return currentQuestions;
      }

      const nextQuestions = currentQuestions.filter(
        (_, index) => index !== questionIndex
      );

      setQuestionErrors((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[currentQuestions[questionIndex].id];
        return nextErrors;
      });

      return nextQuestions;
    });
  };

  const moveQuestion = (questionIndex: number, direction: -1 | 1) => {
    setQuestions((currentQuestions) => {
      const nextIndex = questionIndex + direction;

      if (nextIndex < 0 || nextIndex >= currentQuestions.length) {
        return currentQuestions;
      }

      const nextQuestions = [...currentQuestions];
      const [movedQuestion] = nextQuestions.splice(questionIndex, 1);
      nextQuestions.splice(nextIndex, 0, movedQuestion);
      return nextQuestions;
    });
  };

  const validateStepTwo = () => {
    const nextErrors = getQuestionErrors(questions);
    setQuestionErrors(nextErrors);

    const firstInvalidQuestionId = Object.keys(nextErrors)[0];

    if (firstInvalidQuestionId) {
      requestAnimationFrame(() => {
        scrollToQuestion(firstInvalidQuestionId);
      });
    }

    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      setTitleAttempted(true);

      if (!detailsValid) {
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      setQuestionsAttempted(true);

      if (!validateStepTwo()) {
        return;
      }

      setStep(3);
    }
  };

  const goBack = () => {
    setStep((currentStep) => (currentStep > 1 ? (currentStep - 1) as Step : 1));
  };

  const handleTimerChange = (value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setTimerMinutes(value);
  };

  const handleSubmit = async () => {
    setTitleAttempted(true);
    setQuestionsAttempted(true);

    const questionsValid = validateStepTwo();

    if (!detailsValid || !questionsValid) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/quizzes/create");
      return;
    }

    const token = await getToken();

    if (!token) {
      toast.error(
        "Unable to create the quiz because your session token is missing."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: QuizCreatePayload = {
        title: title.trim(),
        description: description.trim(),
        timer: minutesToSeconds(Number(timerMinutes)),
        questions: questions.map((question) => ({
          question: question.question.trim(),
          image: question.image,
          options: question.options.map((option) => option.text.trim()),
          correctAnswers: question.options.reduce<number[]>((acc, option, index) => {
            if (question.correctOptionIds.includes(option.id)) {
              acc.push(index);
            }

            return acc;
          }, []),
        })),
      };

      await apiFetch<ApiSingleResponse<unknown>>(
        "/quizzes",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      toast.success("Quiz created successfully.");
      router.push("/dashboard");
    } catch (submitError) {
      console.error("Failed to create quiz:", submitError);
      toast.error("Unable to create quiz right now. Please try again.");
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
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Create Quiz
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                Build a new quiz
              </h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
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
                <div
                  key={label}
                  className={`rounded-lg border px-4 py-3 ${
                    isActive
                      ? "border-indigo-300 bg-indigo-50"
                      : isComplete
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-medium text-slate-950">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {step === 1 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Quiz details
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add the basics before writing questions.
            </p>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Marvel Movie Trivia"
                  className={`h-11 rounded-md border px-3 outline-none ring-0 focus:border-indigo-400 ${
                    titleAttempted && title.trim() === ""
                      ? "border-rose-400"
                      : "border-slate-300"
                  }`}
                />
                {titleAttempted && title.trim() === "" ? (
                  <span className="text-xs text-rose-600">
                    Title is required.
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short summary shown on quiz cards"
                  rows={5}
                  className={`rounded-md border px-3 py-2 outline-none focus:border-indigo-400 ${
                    titleAttempted && description.trim() === ""
                      ? "border-rose-400"
                      : "border-slate-300"
                  }`}
                />
                {titleAttempted && description.trim() === "" ? (
                  <span className="text-xs text-rose-600">
                    Description is required.
                  </span>
                ) : null}
              </label>

              <label className="grid max-w-sm gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Time Limit (minutes)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={timerMinutes}
                  onChange={(event) => handleTimerChange(event.target.value)}
                  placeholder="10"
                  className={`h-11 rounded-md border px-3 outline-none focus:border-indigo-400 ${
                    titleAttempted && timerError
                      ? "border-rose-400"
                      : "border-slate-300"
                  }`}
                  aria-describedby="timer-help"
                />
                <p id="timer-help" className="text-xs text-slate-500">
                  Enter a whole number from 1 to 180 minutes.
                </p>
                {titleAttempted && timerError ? (
                  <span className="text-xs text-rose-600">{timerError}</span>
                ) : null}
              </label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Questions
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Add at least one question, optionally include an image, and
                  make sure every question has four options.
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {questions.length} question
                    {questions.length === 1 ? "" : "s"} added
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add question
              </button>
            </div>

            <div ref={questionContainerRef} className="mt-6 space-y-6">
              {questions.map((question, questionIndex) => (
                <div key={question.id} data-qid={question.id}>
                  <QuestionCard
                    question={question}
                    index={questionIndex}
                    errors={questionsAttempted ? questionErrors[question.id] : undefined}
                    onChange={(nextQuestion) =>
                      updateQuestion(question.id, nextQuestion)
                    }
                    onRemove={() => removeQuestion(questionIndex)}
                    onMoveUp={() => moveQuestion(questionIndex, -1)}
                    onMoveDown={() => moveQuestion(questionIndex, 1)}
                    disableMoveUp={questionIndex === 0}
                    disableMoveDown={questionIndex === questions.length - 1}
                    disableRemove={questions.length === 1}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Review quiz
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Check everything before you publish.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Title
                </p>
                <p className="mt-2 font-semibold text-slate-950">
                  {title || "Untitled"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Timer
                </p>
                <p className="mt-2 font-semibold text-slate-950">
                  {timerError ? "Invalid timer" : formatMinutesLabel(Number(timerMinutes))}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Questions
                </p>
                <p className="mt-2 font-semibold text-slate-950">
                  {questions.length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {questions.map((question, index) => {
                const correctOptionIndexes = question.options.reduce<number[]>(
                  (acc, option, optionIndex) => {
                    if (question.correctOptionIds.includes(option.id)) {
                      acc.push(optionIndex);
                    }

                    return acc;
                  },
                  []
                );

                return (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">
                          Q{index + 1}.{" "}
                          {question.question || "Missing question text"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Correct answers:{" "}
                          {correctOptionIndexes.length > 0
                            ? correctOptionIndexes
                                .map((optionIndex) => `Option ${optionIndex + 1}`)
                                .join(", ")
                            : "Not selected"}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {question.image ? "Image attached" : "No image"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Publish Quiz
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
