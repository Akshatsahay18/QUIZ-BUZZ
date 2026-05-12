"use client";

import {
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { BarChart3, CircleHelp, Menu, Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/quizzes", label: "Quizzes", icon: CircleHelp },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-semibold text-slate-950"
        >
          <span className="grid size-9 place-items-center rounded-md bg-slate-950 text-white">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span>QuizBuzz</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isSignedIn ? (
            <>
              <Link
                href="/quizzes/create"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="size-4" aria-hidden="true" />
                New quiz
              </Link>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-md border border-slate-200 text-slate-700 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation drawer"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[86vw] max-w-sm border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Menu</span>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="flex h-[calc(100%-4rem)] flex-col justify-between p-4">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-200 pt-4">
              {isSignedIn ? (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/quizzes/create"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    New quiz
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
                    Sign in
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
