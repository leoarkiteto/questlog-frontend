# Questlog Frontend

Next.js frontend for the Questlog personal game tracker. Dark-themed mobile-first UI for tracking your game collection.

## Stack

| Layer    | Tech                                        |
| -------- | ------------------------------------------- |
| Runtime  | Next.js 15 (App Router, TypeScript, Tailwind v4) |
| Hosting  | Vercel                                      |
| API      | Separate Go backend (Render)                |

## Quick start

```bash
# 1. Install dependencies:
npm ci

# 2. Set the API URL (local dev points to :8080):
echo 'NEXT_PUBLIC_API_URL=http://localhost:8080' > .env.local

# 3. Start the dev server on :3000:
npm run dev
```

Open http://localhost:3000. Make sure the [Questlog API](../questlog-api) is running on `:8080`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo at https://vercel.com/new (framework: Next.js — detected automatically).
3. Add the **Vercel environment variable**:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL (e.g. `https://questlog-api.onrender.com`)
4. Vercel deploys automatically on every push to `main`.

The old same-origin `/api/*` rewrites are gone — the backend is a separate service now. All API calls go through `NEXT_PUBLIC_API_URL`.

## Using it from your phone

The main device is a smartphone. Run the backend on your machine, then:

```bash
NEXT_PUBLIC_API_URL=http://<your-machine-ip>:8080 npm run dev
```

Open `http://<your-machine-ip>:3000` from the phone (both devices on the same network).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
