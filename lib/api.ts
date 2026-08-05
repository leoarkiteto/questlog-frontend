import type { CatalogAppDetails, CatalogResult, Game, GameInput, Status } from "./types";

/**
 * Base URL of the Go API. The backend is hosted separately on Render
 * (or localhost:8080 for local dev). Set NEXT_PUBLIC_API_URL in your
 * Vercel environment to the Render service URL.
 *
 *   NEXT_PUBLIC_API_URL=https://questlog-api.onrender.com
 */
function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env !== undefined && env !== "") return env;
  return "http://localhost:8080";
}

const API_BASE = apiBase();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  list: (status?: Status) =>
    request<Game[]>(`/api/games${status ? `?status=${status}` : ""}`),
  get: (id: string | number) => request<Game>(`/api/games/${id}`),
  create: (input: GameInput) =>
    request<Game>("/api/games", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string | number, input: GameInput) =>
    request<Game>(`/api/games/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  remove: (id: string | number) =>
    request<void>(`/api/games/${id}`, { method: "DELETE" }),

  catalog: {
    search: (q: string) =>
      request<CatalogResult[]>(`/api/catalog/search?q=${encodeURIComponent(q)}`),
    app: (source: string, appid: number | string) =>
      request<CatalogAppDetails>(`/api/catalog/app/${source}/${appid}`),
  },
};
