"use client";

import { Server } from "lucide-react";
import { useEffect, useState } from "react";

type ApiState = "checking" | "online" | "offline";

export function ApiStatus() {
  const [state, setState] = useState<ApiState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/_docs/openapi.json", { signal: controller.signal })
      .then((response) => {
        setState(response.ok ? "online" : "offline");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState("offline");
        }
      });

    return () => controller.abort();
  }, []);

  const copy = {
    checking: "Checking API",
    online: "API online",
    offline: "API offline",
  } satisfies Record<ApiState, string>;

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
      <Server className="size-4 text-sky-600" aria-hidden="true" />
      <span>{copy[state]}</span>
      <span
        className={`size-2 rounded-full ${
          state === "online"
            ? "bg-emerald-500"
            : state === "offline"
              ? "bg-rose-500"
              : "bg-amber-400"
        }`}
        aria-hidden="true"
      />
    </div>
  );
}
