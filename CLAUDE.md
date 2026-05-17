# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dertin is an ephemeral event-based dating web app. Users scan a QR code at a real-world event, create a temporary profile, and swipe on other attendees Tinder-style. Profiles and data expire with the event (24h max). Mobile-first, dark mode only, no permanent accounts.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000, Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (flat config, Next.js core-web-vitals + typescript)
```

No test runner is configured yet.

## Tech Stack

- **Next.js 16.2.6** (App Router) — React 19, Turbopack
- **TypeScript** — strict mode, `@/*` path alias maps to project root
- **Tailwind CSS v4** — via `@tailwindcss/postcss`, configured in `app/globals.css` `@theme` blocks
- **shadcn/ui** — base-nova style, components in `components/ui/`
- **Supabase** — database, storage, realtime. Project ref `cyariclckklsyojpdqxj`
- **Zustand** — client state (session, swipe, matches)
- **Framer Motion** — swipe card animations
- **React Hook Form + Zod** — available but not yet wired into forms

## Architecture

```
app/                        # Next.js App Router
├── page.tsx                # Landing page
├── event/[slug]/           # Event entry + onboarding + swipe
│   ├── page.tsx            # Server component: fetches event, renders EventLanding
│   ├── event-landing.tsx   # Client: checks existing user, shows event info
│   ├── onboarding/page.tsx # Profile creation flow (2-step: info → photos)
│   └── swipe/page.tsx      # Swipe engine with drag cards
├── matches/page.tsx        # Match list
├── chat/[matchId]/page.tsx # 1:1 chat (5 msg limit per user)
└── admin/                  # Admin dashboard
    ├── page.tsx            # Event list
    ├── events/page.tsx     # Create event form
    └── events/[id]/page.tsx # Event detail: stats, QR, user management

lib/
├── supabase.ts             # Supabase client singleton
├── fingerprint.ts          # Device fingerprint (localStorage UUID)
└── utils.ts                # cn() utility (shadcn)

stores/
├── session.ts              # Current event + user (persisted to localStorage)
├── swipe.ts                # Swipe candidates + index
└── matches.ts              # Match list

types/
└── database.ts             # Supabase Database type + row type aliases

supabase/migrations/        # SQL migrations (applied to remote)
├── 001_initial_schema.sql  # Tables: events, event_users, profile_photos, swipes, matches, chat_messages, reports, blocked_users, admin_users
└── 002_rls_and_storage.sql # RLS policies + storage buckets (profile-photos, event-covers)
```

## Critical Rules

- **All user-facing text MUST be in pt-BR (Brazilian Portuguese).** Code can be in English but every string rendered in the UI must be Portuguese.
- **Next.js 16 has breaking changes.** Read `node_modules/next/dist/docs/` before using unfamiliar APIs. Key difference: `params` in page components is a `Promise` that must be awaited.
- **Camera-only photos.** Use `<input type="file" accept="image/*" capture="environment">`. Never allow gallery selection.
- **No permanent accounts.** Users exist only within an event scope. Session via localStorage fingerprint.
- **Use the Supabase MCP** for database operations. CLI is linked: `npx supabase db query --linked "SQL"`.
- **Dark mode only.** The `<html>` element always has class `dark`. No light mode toggle.

## Supabase

- MCP configured in `.mcp.json`, project ref `cyariclckklsyojpdqxj`
- CLI linked to project. Run queries with: `npx supabase db query --linked "SQL"`
- Storage buckets: `profile-photos` (public), `event-covers` (public)
- RLS is enabled on all tables with permissive policies (MVP — tighten for production)

## Tailwind CSS v4 Notes

- No `tailwind.config.js` — all config in CSS via `@theme` blocks in `globals.css`
- PostCSS plugin is `@tailwindcss/postcss`
- Import via `@import "tailwindcss"`
- Custom colors: `--purple`, `--purple-light`, `--purple-dark` (oklch hue 285)

## Environment Variables

Copy `.env.example` to `.env.local`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

@AGENTS.md
