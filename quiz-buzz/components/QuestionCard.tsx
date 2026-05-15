"use client";

import { ArrowDown, ArrowUp, CheckCircle2, Trash2 } from "lucide-react";
import { useId } from "react";
import { QuestionImageUpload } from "@/components/questions/QuestionImageUpload";
import type {
  BuilderQuestion,
  QuestionErrors,
} from "@/lib/question-builder";

interface QuestionCardProps {
  question: BuilderQuestion;
  index: number;
  errors?: QuestionErrors;
  onChange: (question: BuilderQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  disableRemove?: boolean;
}

export default function QuestionCard({
  question,
  index,
  errors,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  disableMoveUp = false,
  disableMoveDown = false,
  disableRemove = false,
}: QuestionCardProps) {
  const radioName = useId();

  const updateOptionText = (optionId: string, text: string) => {
    onChange({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, text } : option
      ),
    });
  };

  const updateImage = (image?: string) => {
    onChange({
      ...question,
      image,
    });
  };

  const updateUploadingState = (isUploading: boolean) => {
    onChange({
      ...question,
      isUploading,
    });
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">
              Q{index + 1}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Question {index + 1}
              </h3>
              <p className="text-sm text-slate-500">
                Add a prompt, optional image, four choices, and the correct
                answer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disableMoveUp}
            aria-label={`Move question ${index + 1} up`}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disableMoveDown}
            aria-label={`Move question ${index + 1} down`}
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disableRemove}
            aria-label={`Remove question ${index + 1}`}
            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            Question text
          </span>
          <textarea
            aria-label={`Question ${index + 1} text`}
            value={question.question}
            onChange={(event) =>
              onChange({
                ...question,
                question: event.target.value,
              })
            }
            rows={3}
            className={`rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-400 ${
              errors?.question ? "border-rose-400" : "border-slate-300"
            }`}
            placeholder="Ask something clear and specific..."
          />
          {errors?.question ? (
            <span className="text-xs text-rose-600">{errors.question}</span>
          ) : null}
        </label>

        <QuestionImageUpload
          questionId={question.id}
          image={question.image}
          isUploading={question.isUploading}
          onImageChange={updateImage}
          onUploadingChange={updateUploadingState}
        />
        {errors?.image ? (
          <p className="text-xs text-rose-600">{errors.image}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <label key={option.id} className="grid gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={radioName}
                  aria-label={`Mark option ${optionIndex + 1} correct for question ${index + 1}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() =>
                    onChange({
                      ...question,
                      correctOptionId: option.id,
                    })
                  }
                  className="size-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Option {optionIndex + 1}
                </span>
                {question.correctOptionId === option.id ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Correct
                  </span>
                ) : null}
              </div>
              <input
                aria-label={`Option ${optionIndex + 1} text`}
                value={option.text}
                onChange={(event) =>
                  updateOptionText(option.id, event.target.value)
                }
                className={`h-11 rounded-xl border px-3 outline-none transition focus:border-indigo-400 ${
                  errors?.options?.[optionIndex]
                    ? "border-rose-400"
                    : "border-slate-300"
                }`}
                placeholder={`Enter option ${optionIndex + 1}`}
              />
              {errors?.options?.[optionIndex] ? (
                <span className="text-xs text-rose-600">
                  {errors.options[optionIndex]}
                </span>
              ) : null}
            </label>
          ))}
        </div>

        {errors?.correctOption ? (
          <p className="text-xs text-rose-600">{errors.correctOption}</p>
        ) : null}
      </div>
    </article>
  );
}
