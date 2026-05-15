export const MIN_TIMER_MINUTES = 1;
export const MAX_TIMER_MINUTES = 180;

export const minutesToSeconds = (minutes: number) => minutes * 60;

export const secondsToMinutes = (seconds: number) =>
  Math.floor(seconds / 60);

export const formatMinutesLabel = (minutes: number) =>
  `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

export const formatMinutesShortLabel = (minutes: number) =>
  `${minutes} ${minutes === 1 ? "min" : "mins"}`;

export const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};
