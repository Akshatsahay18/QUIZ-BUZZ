import type { ApiListResponse, ApiSingleResponse } from "./types";

const getApiOrigin = () => {
  return process.env.QUIZ_BUZZ_API_ORIGIN?.replace(/\/$/, "") ?? "http://localhost:8040";
};

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    return `${getApiOrigin()}/api/v1${normalizedPath}`;
  }

  return `/api/v1${normalizedPath}`;
};

export const normalizeList = <T>(response: ApiListResponse<T>) => {
  const docs = response.docs ?? response.data ?? [];
  const page = response.page ?? 1;
  const limit = response.limit ?? (docs.length > 0 ? docs.length : 10);
  const total = response.total ?? docs.length;

  return {
    docs,
    page,
    limit,
    total,
    pages: response.pages ?? Math.ceil(total / (limit || 1)),
    hasNext: response.hasNext ?? false,
    hasPrev: response.hasPrev ?? false,
  };
};

export const normalizeSingle = <T>(response: ApiSingleResponse<T>) => {
  return response.data ?? response.doc ?? response.item ?? null;
};

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    cache: init?.cache ?? "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};