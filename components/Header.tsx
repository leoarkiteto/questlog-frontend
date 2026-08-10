"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Sticky top bar: logo, search field, add button.
 */
export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const clear = () => {
    setQ("");
    inputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/questlog.png" alt="Questlog" className="h-6 w-auto" />
        </Link>

        <form
          onSubmit={submit}
          className="ml-auto flex min-w-0 flex-1 justify-end sm:max-w-sm"
        >
          <div className="relative w-full max-w-[10rem] transition-all focus-within:max-w-full sm:max-w-full">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-zinc-500"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your library…"
              aria-label="Search your library"
              className="w-full truncate rounded-full border border-white/10 bg-zinc-900 py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-red-500/50 focus:bg-zinc-900"
            />
            {q.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </form>

        <Link
          href="/games/new"
          aria-label="Add game"
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 active:scale-95 md:grid"
        >
          +
        </Link>
      </div>
    </header>
  );
}
