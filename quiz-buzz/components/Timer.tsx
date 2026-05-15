"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatCountdown } from "@/lib/time";

interface TimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export function Timer({ initialSeconds, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  const formattedTime = formatCountdown(timeLeft);

  const isWarning = timeLeft <= 60;
  const isCritical = timeLeft <= 30;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        isCritical
          ? "bg-red-50 text-red-700"
          : isWarning
            ? "bg-amber-50 text-amber-700"
            : "bg-blue-50 text-blue-700"
      }`}
    >
      <Clock
        className={`size-4 ${isCritical ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      <span>{formattedTime}</span>
    </div>
  );
}
