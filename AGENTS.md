# DAFS Sarlu public site

Next.js App Router application using React, TypeScript, Tailwind CSS v4, and Supabase.

## Development

- `npm run dev` starts Next.js on `0.0.0.0` (default port 3000; set `PORT` to override).
- `npm run build` creates the production build; `npm start` serves it.
- Public routes are handled by the optional catch-all route in `app/[[...slug]]/page.tsx`.

## Environment

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put a Supabase secret key in a browser or `NEXT_PUBLIC_` variable. The publishable key is used with Row Level Security.

## Source

- `app/layout.tsx` contains metadata and global CSS setup.
- `src/App.tsx` holds the public React interface.
- `src/lib/supabase.ts` creates the browser Supabase client.
- `supabase/migrations` contains SQL migrations; apply them from the Supabase SQL Editor.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
