"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { STATUSES } from "@/lib/types";
import type { Game, Status } from "@/lib/types";
import GameCard from "@/components/molecules/GameCard/GameCard";
import EmptyState from "@/components/molecules/EmptyState/EmptyState";
import StatusIcon from "@/components/atoms/StatusIcon/StatusIcon";
import { SlidersHorizontal, X } from "lucide-react";

type Sort = "recent" | "title" | "rating";

const SORTS: { value: Sort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "title", label: "Title A–Z" },
  { value: "rating", label: "Rating (highest first)" },
];

const FILTERS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...STATUSES.map((s) => ({ value: s.value as Status, label: s.label })),
];

function isFilter(value: string | null): value is Status | "all" {
  return value !== null && FILTERS.some((f) => f.value === value);
}

function isSort(value: string | null): value is Sort {
  return value !== null && SORTS.some((s) => s.value === value);
}

function LibraryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [platform, setPlatform] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recent");
  const [panelOpen, setPanelOpen] = useState(false);

  // Keep in sync when navigating here from a row's "Show all" link
  // or from a shared /library?filter=…&platform=…&sort=… URL.
  useEffect(() => {
    setFilter(isFilter(params.get("filter")) ? (params.get("filter") as Status | "all") : "all");
    const p = params.get("platform");
    setPlatform(p && p.trim() ? p.trim() : null);
    setSort(isSort(params.get("sort")) ? (params.get("sort") as Sort) : "recent");
  }, [params]);

  useEffect(() => {
    api
      .list()
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  // Distinct platforms actually used in the collection (free-text field,
  // so the canonical PLATFORMS list isn't reliable here).
  const platforms = useMemo(() => {
    const seen = new Set<string>();
    for (const g of games) {
      const p = g.platform.trim();
      if (p) seen.add(p);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [games]);

  const countFor = (p: string) => games.filter((g) => g.platform.trim() === p).length;

  const activeCount =
    (filter !== "all" ? 1 : 0) + (platform !== null ? 1 : 0) + (sort !== "recent" ? 1 : 0);

  const syncUrl = (f: Status | "all", p: string | null, s: Sort) => {
    const sp = new URLSearchParams();
    if (f !== "all") sp.set("filter", f);
    if (p) sp.set("platform", p);
    if (s !== "recent") sp.set("sort", s);
    router.replace(sp.size > 0 ? `/library?${sp.toString()}` : "/library");
  };

  const apply = (next: { filter?: Status | "all"; platform?: string | null; sort?: Sort }) => {
    const f = next.filter ?? filter;
    const p = next.platform !== undefined ? next.platform : platform;
    const s = next.sort ?? sort;
    setFilter(f);
    setPlatform(p);
    setSort(s);
    syncUrl(f, p, s);
  };

  const reset = () => {
    setPanelOpen(false);
    apply({ filter: "all", platform: null, sort: "recent" });
  };

  // Close the slide panel with Escape.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  // Lock body scroll while the filter panel is open — only the pane
  // (its content area is overflow-y-auto) should scroll.
  useEffect(() => {
    if (!panelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelOpen]);

  const shown = useMemo(() => {
    const matches = games.filter(
      (g) =>
        (filter === "all" || g.status === filter) &&
        (platform === null || g.platform.trim() === platform)
    );
    return matches.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "rating") return b.rating - a.rating || a.title.localeCompare(b.title);
      return b.createdAt.localeCompare(a.createdAt); // recent — newest first
    });
  }, [games, filter, platform, sort]);

  return (
    <div className="px-4 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Library</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{shown.length} games</span>
          <button
            onClick={() => setPanelOpen(true)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCount > 0
                ? "bg-red-600 text-white"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-white/10 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeCount > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20 text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : shown.length === 0 ? (
        <EmptyState
          title={activeCount === 0 ? "Your library is empty" : "Nothing matches"}
          message="Games you add will show up here, organized by status."
          actionHref="/games/new"
        />
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {shown.map((g) => (
            <GameCard key={g.id} game={g} className="w-full" glow={g.status === "playing"} />
          ))}
        </div>
      )}

      {/* Filter slide panel */}
      <div
        className={`fixed inset-0 z-50 ${panelOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!panelOpen}
      >
        <div
          onClick={() => setPanelOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            panelOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Filter library"
          className={`absolute inset-y-0 right-0 flex w-80 max-w-[90vw] flex-col border-l border-white/10 bg-zinc-950 shadow-2xl transition-transform duration-300 ${
            panelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-bold text-zinc-100">Filters</h2>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close filters"
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {/* Status */}
            <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </p>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => apply({ filter: f.value })}
                className={`flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  filter === f.value
                    ? "bg-red-600/15 text-red-300 ring-1 ring-red-500/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                {f.value !== "all" && (
                  <StatusIcon status={f.value as Status} className="h-3.5 w-3.5" />
                )}
                {f.label}
              </button>
            ))}

            {/* Platform */}
            <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Platform
            </p>
            <button
              onClick={() => apply({ platform: null })}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                platform === null
                  ? "bg-red-600/15 text-red-300 ring-1 ring-red-500/30"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <span>All platforms</span>
              <span className="text-xs text-zinc-500">{games.length}</span>
            </button>
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => apply({ platform: p })}
                className={`mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                  platform === p
                    ? "bg-red-600/15 text-red-300 ring-1 ring-red-500/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <span className="truncate">{p}</span>
                <span className="text-xs text-zinc-500">{countFor(p)}</span>
              </button>
            ))}

            {/* Sort */}
            <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Sort
            </p>
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => apply({ sort: s.value })}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                  sort === s.value
                    ? "bg-red-600/15 text-red-300 ring-1 ring-red-500/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {activeCount > 0 && (
            <div className="border-t border-white/5 p-4">
              <button
                onClick={reset}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-300 ring-1 ring-white/10 transition hover:bg-zinc-800 hover:text-zinc-100"
              >
                Reset filters
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<p className="px-4 text-sm text-zinc-500 sm:px-6">Loading…</p>}>
      <LibraryContent />
    </Suspense>
  );
}
