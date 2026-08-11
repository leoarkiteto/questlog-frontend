# Questlog Frontend

A personal video-game tracker — a Netflix-style catalog to log games by status (wishlist, purchased, playing, played, dropped). Built as a single static frontend that talks to a separate Go API.

## Tech Stack

| Concern           | Choice                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router)                                              |
| UI                | React 19 (client components everywhere)                              |
| Language          | TypeScript 5.8, strict mode                                          |
| Styling           | Tailwind CSS v4 + shadcn/ui (base-nova preset, `@base-ui/react`)     |
| Icons             | lucide-react                                                        |
| Font              | Geist (next/font/google)                                             |
| Linting           | ESLint 9 flat config (core-web-vitals + typescript rules)            |
| Testing           | Vitest 4                                                            |
| Package manager   | npm                                                                 |
| Deployment        | Vercel (`framework: "nextjs"`)                                       |
| Backend           | Go API hosted on Render, reached via `NEXT_PUBLIC_API_URL`           |

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
npm test         # Vitest (run)
```

## Architecture

### Client-only app

Every route file starts with `"use client"`. There are no React Server Components — data fetching happens client-side via `useEffect` → `fetch()`. This is intentional: the app is a personal single-user dashboard with no SEO needs.

### Data layer (`lib/api.ts`)

A thin `fetch()` wrapper that hits the Go backend. The base URL defaults to `http://localhost:8080` locally and reads `NEXT_PUBLIC_API_URL` in production (set on Vercel to the Render service URL).

Endpoints:

- `api.list(status?)` — GET `/api/games`
- `api.get(id)` — GET `/api/games/:id`
- `api.create(input)` — POST `/api/games`
- `api.update(id, input)` — PUT `/api/games/:id`
- `api.remove(id)` — DELETE `/api/games/:id`
- `api.catalog.search(q)` — GET `/api/catalog/search?q=`
- `api.catalog.app(source, appid)` — GET `/api/catalog/app/:source/:appid`

### Types (`lib/types.ts`)

Core types: `Game`, `GameInput`, `Status` (union of 5 strings), `CatalogResult`, `CatalogAppDetails`, `StatusInfo`. Statuses drive the Netflix-style row layout on the dashboard — each status gets its own horizontal scroll row with a color accent.

### Routing

| Route                 | File                       | Purpose                    |
| --------------------- | -------------------------- | -------------------------- |
| `/`                   | `app/page.tsx`             | Dashboard with status rows |
| `/games/[id]`         | `app/games/[id]/page.tsx`  | Game detail                |
| `/games/[id]/edit`    | `app/games/[id]/edit/page.tsx` | Edit game              |
| `/games/new`          | `app/games/new/page.tsx`   | Add new game               |
| `/library`            | `app/library/page.tsx`     | Full grid view             |
| `/search`             | `app/search/page.tsx`      | Search results             |

### Component tree

```
layout.tsx
├── Header.tsx (sticky top bar: logo, search, add button)
├── <main> (page content)
└── BottomNav.tsx (mobile-only: Home · Add · Library)
```

Key components:

- `GameCard.tsx` — cover image + rating + platform icon
- `GameRow.tsx` — horizontal scroll row for the dashboard
- `GameForm.tsx` — large form for add/edit (≈16KB, the biggest component)
- `PlatformIcon.tsx` — maps platform strings to brand SVGs (PlayStation/Xbox/Nintendo/Steam)
- `StarRating.tsx`, `StatusBadge.tsx`, `StatusIcon.tsx`, `EmptyState.tsx`
- `components/atoms/Button/Button.tsx` — shadcn Button (base-nova preset)

### Styling conventions

- **Dark-only** — `color-scheme: dark`, `dark` class on `<html>`, zinc-950 backgrounds
- **Mobile-first** — responsive with `md:` breakpoints, fixed mobile bottom nav
- **Custom utilities** — `.no-scrollbar` and `.row-fade` for Netflix-style horizontal scroll rows
- **shadcn/ui** — CSS variables in `globals.css` with Tailwind v4's `@theme inline`, `cn()` helper from `lib/utils.ts`
- **No CSS modules** — everything is Tailwind utility classes + global CSS

### Path aliases

`@/*` maps to the project root (`./*`), configured in `tsconfig.json`.

## Conventions

- **No default exports** — use named exports everywhere (except Next.js-required `default export` for page/layout components)
- **`"use client"`** at the top of every page and component file
- **Data fetching pattern**: `useEffect` → async function → `useState` for loading/data/error
- **`cn()`** from `@/lib/utils` for merging Tailwind classes (uses `clsx` + `tailwind-merge`)
- **ESLint override**: `react-hooks/set-state-in-effect` is off because mount-time data fetching is the standard pattern here
- **Prefer shadcn/ui** — when building a new UI primitive (button, dialog, input, select, tooltip, avatar, etc.), check if shadcn/ui already ships it and use that instead of building from scratch. Only build custom when no shadcn equivalent exists or the component is domain-specific (e.g. `GameCard`, `PlatformIcon` — these are not generic UI primitives).

## Adding shadcn/ui components

```bash
npx shadcn@latest add <component-name>
```

Components are generated into `components/ui/`. They use the base-nova preset (not Radix), so buttons, dialogs, etc. are built on `@base-ui/react` primitives. Tailwind v4 means no `tailwind.config.ts` — all theming is in `app/globals.css` via CSS variables and `@theme inline`.

After adding, move the component into the appropriate Atomic Design layer: shadcn primitives are typically **atoms** (`components/atoms/`), and composite components built on them go into `molecules/` or `organisms/`.

## Environment

| Variable               | Purpose                        | Default                   |
| ---------------------- | ------------------------------ | ------------------------- |
| `NEXT_PUBLIC_API_URL`  | Go backend base URL            | `http://localhost:8080`   |

## Backend

The Go API repo lives separately. It runs on Render in production and on `localhost:8080` for local dev. The frontend has no backend-for-frontend — all API calls go directly to the Go service from the browser.
