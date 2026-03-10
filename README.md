# Wonderbook AI - Interactive Storybook MVP

## Architecture (quick overview)

This app uses a Next.js App Router frontend + backend route handlers with a service-oriented core:

- `app/*`: pages and API routes (session creation, page turn, job polling, export).
- `components/*`: reusable UI blocks (`StorybookLayout`, `DrawingCanvas`, `StoryProgress`, `PageTurn`, `GenerationOverlay`).
- `lib/services/story/*`: prompt templates + story providers (LLM + mock fallback).
- `lib/services/animation/*`: provider abstraction with `GrokImagineProvider` placeholder and mock provider.
- `lib/repositories/*`: persistence repository layer with Supabase path and in-memory fallback for local/demo mode.
- `supabase/migrations/*`: SQL schema for `story_sessions`, `story_pages`, `animation_jobs`.

Flow: parent configures story -> child draws -> drawing is animated -> next story page is generated with continuity -> final replay/export page.

## Features included

- Landing page + setup form + story reader + final summary/timeline page
- Kid-friendly drawing canvas (mouse/touch, colors, brush size, eraser, undo, clear, PNG export)
- Magical generation overlay + page-turn style transition
- Story continuity engine with prompt templates and child-safe sanitization
- Animation provider abstraction with mock mode + Grok Imagine integration seam
- Retry flow for generation failures
- Autosave draft drawing in local storage
- Session export endpoint (`/api/export/[sessionId]`)
- Drawings persisted to Supabase `drawings` bucket and generated media copied to `animations` bucket when configured

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Supabase/Postgres compatible data model
- Framer Motion for immersive transitions

## Environment setup

Copy `.env.example` to `.env.local` and fill values as needed:

```bash
cp .env.example .env.local
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo mode (recommended first run)

Set:

- `MOCK_STORY_MODE=true`
- `MOCK_ANIMATION_MODE=true`
- `NEXT_PUBLIC_DEMO_MODE=true`

This gives a full runnable flow without external AI keys.

## Supabase setup

1. Create a Supabase project.
2. Run SQL from `supabase/migrations/20260309_init_storybook.sql`.
3. Create storage buckets:
   - `drawings`
   - `animations`
   - Buckets can be public, or private if you rely on signed URLs.
4. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - one server key: `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
   - fallback (dev-only): `SUPABASE_ANON_KEY` (or reuse anon key)

## LLM story generation setup (optional)

Set:

- `LLM_API_KEY`
- `LLM_BASE_URL` (OpenAI-compatible endpoint)
- `LLM_MODEL`

If unavailable, the app automatically uses the mock story provider.

## Grok Imagine integration setup (optional placeholder)

Set:

- `XAI_API_KEY` (recommended)
- `GROK_IMAGINE_API_KEY`
- `GROK_IMAGINE_BASE_URL`

Current integration points are isolated in `lib/services/animation/providers/GrokImagineProvider.ts`.
Comments in that file mark where final API request/response mapping should be completed.

## Build and production checks

```bash
npm run lint
npm run build
```

## Deploy notes (Vercel + Supabase)

1. Push project to your Git provider.
2. Import into Vercel.
3. Configure all env vars from `.env.example`.
4. Ensure Supabase migration + storage buckets are created.
5. Deploy.

The app works in mock mode on Vercel even before AI providers are connected.
