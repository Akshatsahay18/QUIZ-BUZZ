"use client";

import React, { useId } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

export type OptionItem = { id: string; text: string };

export type BuilderQuestion = {
  id: string;
  question: string;
  options: OptionItem[];
  correctOptionId?: string | null;
};

export type QuestionErrors = {
  question?: string | null;
  options?: (string | null)[];
  correctOption?: string | null;
};

interface Props {
  question: BuilderQuestion;
  index: number;
  errors?: QuestionErrors;
  onChange: (q: BuilderQuestion) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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
  disableRemove
}: Props) {
  const setQuestionText = (text: string) => {
    onChange({ ...question, question: text });
  };

  const setOptionText = (optionId: string, text: string) => {
    const next = question.options.map((o) => (o.id === optionId ? { ...o, text } : o));
    onChange({ ...question, options: next });
  };

  const setCorrect = (optionId: string) => {
    onChange({ ...question, correctOptionId: optionId });
  };

  const radioName = useId();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-3 py-1 text-sm font-semibold text-white">Q{index + 1}</span>
            <h3 className="ml-1 text-lg font-semibold text-slate-950">Question {index + 1}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onMoveUp} aria-label={`Move question ${index + 1} up`} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-50">
            <ArrowUp className="size-4" />
          </button>
          <button type="button" onClick={onMoveDown} aria-label={`Move question ${index + 1} down`} className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 disabled:opacity-50">
            <ArrowDown className="size-4" />
          </button>
          {!disableRemove && (
            <button type="button" onClick={onRemove} aria-label={`Remove question ${index + 1}`} className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600">
              <Trash2 className="size-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Question text</span>
          <input
            aria-label={`Question ${index + 1} text`}
            value={question.question}
            onChange={(e) => setQuestionText(e.target.value)}
            className={`h-11 rounded-md border px-3 outline-none focus:border-indigo-400 ${errors?.question ? "border-rose-400" : "border-slate-300"}`}
          />
          {errors?.question ? <span className="text-xs text-rose-600">{errors.question}</span> : null}
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          {question.options.map((option, optIndex) => (
            <label key={option.id} className="grid gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={radioName}
                  aria-label={`Mark option ${optIndex + 1} correct for question ${index + 1}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() => setCorrect(option.id)}
                />
                <span className="text-sm font-medium text-slate-700">Option {optIndex + 1}</span>
              </div>
              <input
                aria-label={`Option ${optIndex + 1} text`}
                value={option.text}
                onChange={(e) => setOptionText(option.id, e.target.value)}
                className={`h-11 rounded-md border px-3 outline-none focus:border-indigo-400 ${errors?.options?.[optIndex] ? "border-rose-400" : "border-slate-300"}`}
              />
              {errors?.options?.[optIndex] ? <span className="text-xs text-rose-600">{errors?.options?.[optIndex]}</span> : null}
            </label>
          ))}
        </div>

        {errors?.correctOption ? <p className="text-xs text-rose-600">{errors.correctOption}</p> : null}
      </div>
    </div>
  );
}
