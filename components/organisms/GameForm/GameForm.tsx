"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { PLATFORMS, STATUSES, statusInfo } from "@/lib/types";
import type { CatalogResult, Game, GameInput, Status } from "@/lib/types";
import StarRating from "../../atoms/StarRating/StarRating.tsx";
import GameCover from "../../atoms/GameCover/GameCover.tsx";
import StatusIcon from "../../atoms/StatusIcon/StatusIcon.tsx";
import { Input } from "../../atoms/Input/Input.tsx";
import { Textarea } from "../../atoms/Textarea/Textarea.tsx";
import { Button } from "../../atoms/Button/Button.tsx";
import { ToggleGroup, ToggleGroupItem } from "../../molecules/ToggleGroup/ToggleGroup.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../molecules/Select/Select.tsx";
import { Alert } from "../../molecules/Alert/Alert.tsx";
import { X } from "lucide-react";

const SOURCE_LABEL: Record<string, string> = {
  steam: "Steam",
  igdb: "IGDB",
};

interface Props {
  initial?: Game;
  submitLabel: string;
  onSubmit: (input: GameInput) => Promise<void>;
}

export default function GameForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "wishlist");
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [steamAppId, setSteamAppId] = useState<number | null>(
    initial?.steamAppId ?? null
  );
  // Average time to finish (minutes), auto-filled from HowLongToBeat
  // when a catalog result is picked. Null = unknown.
  const [timeToBeatMinutes, setTimeToBeatMinutes] = useState<number | null>(
    initial?.timeToBeatMinutes ?? null
  );

  // Steam suggestion state (searches run off the title field)
  const [steamResults, setSteamResults] = useState<CatalogResult[]>([]);
  const [steamSearching, setSteamSearching] = useState(false);
  const [steamFetching, setSteamFetching] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every title change/clear so an in-flight catalog search
  // that resolves late is discarded instead of repopulating suggestions.
  const searchSeq = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Full collection, fetched once on mount, so the form can warn the
  // moment a title/Steam pick collides with an existing card. The API
  // re-enforces this on save (409), so a stale list can't create a dupe.
  const [collection, setCollection] = useState<Game[]>([]);
  useEffect(() => {
    api
      .list()
      .then(setCollection)
      .catch(() => setCollection([]));
  }, []);

  // A game may only appear once — same normalized title or same Steam
  // app id. Approximates the backend rule (repo.normalizeTitle); the
  // server re-checks on save (409), so a mismatch here can only cause a
  // false client-side warning, never a duplicate.
  const normTitle = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const duplicate = collection.find(
    (g) =>
      g.id !== initial?.id &&
      (normTitle(g.title) === normTitle(title) ||
        (g.steamAppId != null && g.steamAppId === steamAppId))
  );
  const duplicateMessage =
    duplicate &&
    `"${duplicate.title}" is already in your collection as ${statusInfo(duplicate.status).label}. A game can only appear once — edit that card to change its list.`;

  const runSteamSearch = async (q: string) => {
    const seq = ++searchSeq.current;
    const term = q.trim();
    if (term.length < 2) return;
    setSteamSearching(true);
    setSteamError(null);
    try {
      const results = await api.catalog.search(term);
      if (seq !== searchSeq.current) return; // superseded by newer input
      setSteamResults(results);
      if (results.length === 0) setSteamError(`No matches for "${term}".`);
    } catch (e) {
      if (seq !== searchSeq.current) return;
      setSteamResults([]);
      setSteamError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      if (seq === searchSeq.current) setSteamSearching(false);
    }
  };

  const handleTitleChange = (v: string) => {
    searchSeq.current++; // discard any in-flight search
    setTitle(v);
    setSteamResults([]); // previous suggestions no longer match
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSteamSearch(v), 500);
  };

  const clearTitle = () => {
    searchSeq.current++; // discard any in-flight search
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setTitle("");
    setSteamResults([]);
    setSteamError(null);
    setSteamSearching(false);
  };

  const pickCatalogResult = async (r: CatalogResult) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSteamFetching(true);
    setSteamError(null);
    try {
      const d = await api.catalog.app(r.source, r.appid);
      setTitle(d.name);
      setCoverUrl(d.coverUrl); // the point — always apply the cover
      setYear(year || (d.year?.toString() ?? "")); // keep user's data if set
      setGenre(genre || d.genre);
      setPlatform(platform || r.platform || d.platform);
      setDescription(description || d.description);
      setSteamAppId(d.source === "steam" ? d.appid : null); // RAWG = non-Steam
      // No manual input exists for this field, so the last-picked
      // catalog entry's HLTB value is the correct state (no fallback
      // to a stale previous value when the new lookup has data).
      setTimeToBeatMinutes(d.timeToBeatMinutes ?? timeToBeatMinutes);
      setSteamResults([]);
    } catch (e) {
      setSteamError(e instanceof Error ? e.message : "Couldn't load that game.");
    } finally {
      setSteamFetching(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (duplicateMessage) {
      setError(duplicateMessage);
      return;
    }

    const parsedYear = year.trim() === "" ? null : Number(year);
    if (parsedYear !== null && (Number.isNaN(parsedYear) || parsedYear < 1950 || parsedYear > 2100)) {
      setError("Year must be between 1950 and 2100.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        status,
        rating,
        platform: platform.trim(),
        year: parsedYear,
        genre: genre.trim(),
        coverUrl: coverUrl.trim(),
        description: description.trim(),
        notes: notes.trim(),
        steamAppId,
        timeToBeatMinutes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  };

  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400";

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Status picker */}
      <div>
        <span className={label}>List</span>
        <ToggleGroup
          value={[status]}
          onValueChange={(v) => v.length > 0 && setStatus(v[0] as Status)}
          variant="outline"
          spacing={2}
          className="flex flex-wrap"
        >
          {STATUSES.map((s) => (
            <ToggleGroupItem
              key={s.value}
              value={s.value}
              className="data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:ring-red-500 flex items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold ring-1 ring-white/10 transition active:scale-[0.98]"
            >
              <StatusIcon status={s.value} className="h-3.5 w-3.5" />
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Title + Steam suggestions */}
      <div>
        <label htmlFor="title" className={label}>
          Title *
        </label>
        <div className="flex gap-2">
          <div className="relative w-full">
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Elden Ring"
              className="pr-9"
              autoFocus
            />
            {title && (
              <button
                type="button"
                onClick={clearTitle}
                aria-label="Clear title"
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => runSteamSearch(title)}
            disabled={steamSearching || steamFetching || title.trim().length < 2}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {steamSearching ? "Searching…" : "Search Steam"}
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-zinc-600">
          Start typing — tap a Steam match to auto-fill cover, year, genre, platform &amp; description.
        </p>

        {steamFetching && (
          <p className="mt-2 text-xs text-zinc-500">Fetching game details…</p>
        )}

        {steamResults.length > 0 && (
          <ul className="mt-2 max-h-56 divide-y divide-white/5 overflow-y-auto rounded-lg bg-zinc-950/60 ring-1 ring-white/5">
            {steamResults.map((r) => (
              <li key={`${r.source}-${r.appid}`}>
                <button
                  type="button"
                  onClick={() => pickCatalogResult(r)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800/70"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{r.name}</span>
                    {r.platform && (
                      <span className="hidden shrink-0 text-[11px] text-zinc-500 sm:inline">
                        {r.platform}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      r.source === "steam"
                        ? "bg-sky-500/15 text-sky-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {steamError && (
          <p className="mt-2 text-xs text-amber-400/90">{steamError}</p>
        )}
        {steamAppId && (
          <p className="mt-2 text-[11px] text-zinc-600">
            ✓ Linked to Steam app {steamAppId}
          </p>
        )}
        {duplicateMessage && (
          <Alert variant="destructive" className="mt-2 bg-amber-950/50 !text-amber-300 ring-1 ring-amber-500/30">
            {duplicateMessage}
          </Alert>
        )}
      </div>

      {/* Rating — only for played / dropped games */}
      {(status === "played" || status === "dropped") && (
        <div>
          <span className={label}>Rating · how much did you like it?</span>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
            <span className="text-xs text-zinc-500">
              {rating === 0 ? "Tap a star" : `${rating} / 5`}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="platform" className={label}>
            Platform
          </label>
          <Select value={platform} onValueChange={(v) => setPlatform(v ?? "")}>
            <SelectTrigger id="platform" className="w-full">
              <SelectValue placeholder="— Select platform —" />
            </SelectTrigger>
            <SelectContent>
              {/* Keep values outside the list (Steam/IGDB auto-fill, legacy games) */}
              {platform !== "" && !PLATFORMS.some((p) => p === platform) && (
                <SelectItem value={platform}>{platform}</SelectItem>
              )}
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="year" className={label}>
            Year
          </label>
          <Input
            id="year"
            type="number"
            min={1950}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2022"
          />
        </div>
      </div>

      <div>
        <label htmlFor="genre" className={label}>
          Genre
        </label>
        <Input
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g. Action RPG"
        />
      </div>

      {/* Cover URL with live preview */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <label htmlFor="coverUrl" className={label}>
            Cover image URL
          </label>
          <Input
            id="coverUrl"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…/cover.jpg"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Auto-filled from Steam, or paste your own link.
          </p>
        </div>
        <div className="w-20 shrink-0">
          <GameCover
            title={title || "Cover"}
            src={coverUrl}
            className="aspect-[2/3] rounded-lg ring-1 ring-white/10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={label}>
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Short description of the game…"
          className="resize-y"
        />
      </div>

      <div>
        <label htmlFor="notes" className={label}>
          Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What did you think? Where to buy it?…"
          className="resize-y"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-950/50 !text-red-300 ring-1 ring-red-500/30">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="destructive"
        size="lg"
        disabled={saving || !!duplicateMessage}
        className="w-full rounded-xl bg-gradient-to-b from-red-500 to-red-700 py-3 text-sm font-bold shadow-lg shadow-red-900/40 active:scale-[0.99]"
      >
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
