# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is **bun** (`bun.lock` is checked in). TypeScript is in `strict` mode.

- `bun dev` — start the dev server (http://localhost:3000)
- `bun run build` — production build
- `bun run start` — serve the production build
- `bun run lint` — run ESLint

There is no test runner configured (no `test` script, no test framework in `package.json`).

## Architecture

A Pomodoro focus timer. The UI is client-side React (Next.js App Router, `app/`). **Current state of the code: all state is still `useState`, so a page refresh resets it** — the persistence layer described below is *decided but not yet implemented*. `zustand` is a dependency but currently unused (and is *not* the chosen sync mechanism — see ADR-0004).

Two routes:
- `/` (`app/page.tsx`) — the main timer screen
- `/setting` (`app/setting/page.tsx`) — ambient sound panel only

### The timer is a two-layer state machine

The core logic is split across two files that must be understood together:

- **`components/focus-time.tsx`** — the orchestrator. Owns the *round* lifecycle as a `Stage` machine: `ready → countdown (5s) → running → complete`, plus the `work`/`break` `Phase`. It holds all the "plan" state (work/break minutes, daily goal hours, long-break minutes, completed-session count, volume) and drives the progress CSS vars.
- **`components/focus-session.tsx`** — the *countdown* engine. Given a `durationSeconds` and a `FocusState` (`{ focusRemainingSeconds, focusRunning, focusEndsAt }`), it ticks. Timing is **deadline-based** (compares `Date.now()` against `focusEndsAt`, not a per-tick decrement) so it stays accurate when the tab is backgrounded; a `visibilitychange` listener re-syncs. It exposes an imperative handle (`start`/`pause`/`reset`) via `useImperativeHandle` so the mini window can drive it.

`focus-time.tsx` mounts `FocusSession` only during the `running` stage, keyed by `${phase}-${activeMinutes}` so a duration/phase change remounts it fresh.

### Persistence & backend (decided, not yet implemented)

The app is being migrated to **Supabase as the single source of truth**. This is
settled design (see `docs/adr/` for the decisions and `GLOSSARY.md` for the
vocabulary); the code below still reflects the pre-migration `useState` version.

- **Identity**: anonymous, **device-scoped** — a client-generated UUID in
  localStorage. Every table is keyed by a **`device_id`** FK (not `user_id`).
  The device→user association is designed in from the start so **Google Auth**
  can be added later without a schema rewrite, and a device's data is
  transferable to the authenticated account. Features requiring *account*
  ownership (vs. device) must first prompt a create-account modal. (ADR-0001)
- **Source of truth & sync**: Supabase is canonical; localStorage is a cache /
  last-known-good **plus a pending queue**. The countdown runs fully offline
  (deadline-based, no network); settings/progress changes queue locally and
  flush on reconnect. Writes are **idempotent** so retries never duplicate rows.
  No conflict resolution (single device). No Zustand/IndexedDB for this.
  (ADR-0004)
- **Progress**: an **append-only log** of completed work sessions
  (`completed_sessions`, each with `started_at`/`completed_at`). Daily progress
  = `count(*)` of the device's sessions whose **local-calendar day of
  `completed_at`** = today (local timezone). Reset is implicit — a new day just
  has no rows. A session counts toward the day it *completes*. (ADR-0002)
- **In-flight timer**: kept in **localStorage only**, never in Supabase —
  `{ phase, durationSeconds, endsAt, startedAt }`. On load, resume if `endsAt`
  is in the future or within a **5-minute grace window**; otherwise discard to
  `ready`. (ADR-0003)
- **Templates**: **app-provided only**, a TypeScript array in code
  (Classic 25/5/15×4, Short 15/3/10×4, Deep Work 52/17/30×4, 90-Minute
  90/20/45×3 — the last number is long-break-every-N). The user's *active*
  template is persisted per device. The **daily goal is a count of completed
  work sessions**, independent of the template (changing durations never
  changes the target).

**Data model** (proposed Supabase tables):
- `devices` — `id` (PK, the anonymous UUID), `created_at`. *(Future: nullable
  `user_id` FK to `auth.users` for the auth link + data transfer.)*
- `settings` — `device_id` (PK/FK), `active_template_id`, `daily_goal_sessions`
  (int), `volume` (int), `updated_at`. One row per device.
- `completed_sessions` — `id` (PK), `device_id` (FK), `started_at`,
  `completed_at` (timestamptz), `work_minutes` (int, denormalized). Append-only.

### Notable behaviors

- **Long break cadence**: a long break replaces a normal break after every Nth completed work session. N is currently hardcoded as `LONG_BREAK_EVERY = 4` in `focus-time.tsx`; post-migration it comes from the active template (see above).
- **Progress bar**: `focus-time.tsx` writes `--focus-progress` / `--focus-fill` directly onto `<html>` (not React state) to avoid a re-render each second; the fixed marquee bars in `app/page.tsx` read these vars to fill like an HP bar.
- **Mini window** (`components/mini-focus-window.tsx`): uses the Document Picture-in-Picture API to render a small always-on-top timer. Chromium-only (Chrome/Edge 116+); the toggle button only renders when `supported` is true, so it's invisible elsewhere.
- **Two independent sound systems**: timer SFX (tick on last 5s, levelup on completion) via `useSoundPlayer` in `focus-time.tsx`, volume set in `sound-setting-popover.tsx`; and ambient loops (rain/fireplace/paper/evening) in `sound-panel.tsx` + `lib/ambient.ts`. Their volumes are separate state.

### Design system

`components/ui/*`, `lib/cojeev/`, `lib/cojeev-motion/`, and `styles/cojeev/*` are a large pre-built component/motion library (buttons, popovers, sliders, marquee, meta-balls, etc.). Application code composes these; don't hand-roll primitives that already exist there.

### Known dead code

- `components/ui/focus-session.tsx` — a second `FocusSession`; the app imports `components/focus-session.tsx`, not this one.
- `components/word-marquee.tsx` — `app/page.tsx` uses `WordMarqueen` from `components/marquee.tsx` instead.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
