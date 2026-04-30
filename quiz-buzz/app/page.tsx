"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowRight, BarChart3, CircleHelp, Timer } from "lucide-react";
import Link from "next/link";
import { ApiStatus } from "@/components/ApiStatus";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="max-w-2xl">
            <ApiStatus />
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              QuizBuzz
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Build timed quizzes, invite players, and keep score without
              making the room wait for a spreadsheet.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isSignedIn ? (
                <Link
                  href="/quizzes/new"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Create quiz
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Sign in to create
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </SignInButton>
              )}
              <Link
                href="/leaderboard"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                View leaderboard
                <BarChart3 className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Live room
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    General Knowledge
                  </h2>
                </div>
                <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Open
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-2xl font-semibold text-slate-950">12</p>
                  <p className="text-xs text-slate-500">Questions</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-2xl font-semibold text-sky-700">42</p>
                  <p className="text-xs text-slate-500">Players</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-2xl font-semibold text-amber-700">30s</p>
                  <p className="text-xs text-slate-500">Timer</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Create",
                  body: "Draft quizzes with four-option questions.",
                  icon: CircleHelp,
                },
                {
                  title: "Time",
                  body: "Keep each round moving with optional timers.",
                  icon: Timer,
                },
                {
                  title: "Rank",
                  body: "Calculate scores and surface the top attempts.",
                  icon: BarChart3,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-md border border-slate-200 bg-white p-4"
                >
                  <item.icon className="size-5 text-sky-700" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
