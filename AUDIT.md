# ADPT Fit — Stabilization Audit

_Generated 2026-04-13. Updated 2026-04-17 with Sprint 1 resolutions._

Scope: establish the "true" state of the repo before Sprint 1 stabilization work begins
for the v1 Trainerize-replacement build.

### Sprint 1 Resolution Summary
- [x] `adpt/` deleted (finding #1)
- [x] `api/` deleted (finding #2)
- [x] 4 staged migrations committed (finding #9)
- [x] `types/database.ts` generated from live schema (finding #6)
- [x] ErrorBoundary added to root, `(app)`, and `(workout)/active` (finding #5)
- [x] AsyncStorage checkpoint/restore in ActiveWorkoutContext (finding #10)
- [x] AGENTS.md house rules appended (finding #7)
- [x] Logo updated: adaptive-icon + splash-icon now use new "A" branding
- [x] app.json backgrounds updated to light (#FFFFFF)
- [ ] Wire `Database` types into `createClient<Database>()` — deferred to Sprint 2 (creates cascading type errors in untyped `.from()` calls)
- [ ] `group_id` column on `workout_exercises` — migration adds it, code writes it, live DB doesn't have it. Migration must be applied to hosted Supabase.
- [ ] Verify staged migrations applied to hosted Supabase (manual step)

---

## TL;DR

The repo has **four real blockers** for Sprint 1:

1. A stale duplicate tree (`adpt/`) still tracked in git.
2. An orphaned Fastify server (`api/`) with an IDOR on `meals`/`workouts` routes, unused by the mobile app.
3. Schema drift — four staged migrations unapplied, plus `meal_logs` referenced in `api/` with no migration backing.
4. Zero error boundaries + zero mid-workout persistence — a crash mid-set loses the whole session.

Everything else is cleanup or type hygiene.

---

## Findings

### 1. Stale `adpt/` directory — **DELETE**

- `adpt/` at repo root is a git-tracked duplicate checkpoint containing older copies of
  `src/screens/onboarding/`, `supabase/migrations/`, and an older `AGENTS.md`.
- **Zero** external imports: no hits for `from ['"].*adpt/` or `require.*adpt/` outside
  the directory itself. Not referenced in `tsconfig.json` paths, `metro.config.js`,
  `app.json`, or any `package.json` script.
- Safe to `git rm -r adpt/` in Sprint 1.

### 2. `api/` Fastify server — **DELETE (with IDOR caveat)**

- Routes defined in `api/src/routes/`: `chat.ts`, `meals.ts`, `workouts.ts`.
- Mobile app never calls them. Zero hits for `EXPO_PUBLIC_API_BASE` in `src/`, `app/`,
  `lib/`. `lib/supabase.ts` is the only data path; there is no `authedFetch` helper
  despite what older conventions docs claim.
- **Security gap while it exists**: `api/src/routes/meals.ts` and `workouts.ts` accept
  a `user_id` query param and do not verify it matches `req.auth.user_id`. Classic IDOR.
  If the server is ever deployed, any authenticated user can read/write another user's
  rows.
- Recommendation: delete `api/` entirely in Sprint 1. Also remove `api`-related scripts
  from root `package.json` if any, and drop `api/` from any CI config.
- If deletion is wrong (i.e. `api/` is deployed somewhere the audit can't see), the
  IDOR must be fixed before Sprint 2 begins.

### 3. Schema drift — **RESOLVE BEFORE ANY COACH WORK**

**Migrations in `supabase/migrations/`** (10 files):
- Applied: `workout_sessions`, `workout_exercises`, `workout_sets`, `user_streaks`,
  `saved_programs`, `user_limitations`, `limitation_feedback`.
- **Staged, not committed** (show as `A` in `git status`):
  - `20260324_xp_rank_system.sql` — `user_xp`, `xp_events`
  - `20260325_user_events.sql` — `user_events`
  - `20260325_workout_templates.sql` — `workout_templates`, adds `notes` + `group_id` to `workout_exercises`
  - `20260328_coaching_platform.sql` — 13 tables: `coaches`, `coach_clients`,
    `coaching_programs`, `program_phases`, `phase_workouts`, `check_in_templates`,
    `check_ins`, `check_in_photos`, `body_stats`, `messages`, `client_subscriptions`,
    `habit_assignments`, `habit_logs`, plus `profiles.role` column.

**Tables referenced by mobile code** that mobile reads/writes via `.from()`:
`workout_sessions`, `workout_exercises`, `workout_sets`, `workout_templates`,
`profiles`, `user_limitations`, `limitation_feedback`, `messages`.

**Tables referenced by `api/` that have no migration**: `meal_logs`. Never created in
any migration file. Either the migration is missing or `api/meals.ts` is dead code
(and will be deleted per finding #2).

**Live Supabase schema vs repo schema** — not verifiable from inside this session.
Troy must either run `supabase db dump --schema public --data=false` or authorize
`supabase link` so a future pass can diff hosted vs repo. Until then, assume drift
exists in addition to what's listed above.

### 4. Storage buckets — **NOT YET USED**

- Zero `.storage.from(` calls anywhere in `app/`, `src/`, `lib/`.
- No `storage.buckets` inserts in any migration.
- The `progress-photos` vs `check-in-photos` naming conflict mentioned in the earlier
  session prompt does **not** exist in the current repo — nothing to reconcile yet.
- Implication: storage bucket design is greenfield when check-in photos and meal-plan
  PDFs land in the coach sprints. Do it right the first time.

### 5. Error boundaries — **MISSING EVERYWHERE**

- `app/_layout.tsx` wraps providers but has no `ErrorBoundary` and no Stack `errorBoundary` prop.
- `app/(app)/_layout.tsx` (the drawer) has no boundary.
- `app/(workout)/active.tsx` has no boundary — and this is the highest-value screen
  to protect (see finding #10).
- No `react-error-boundary` dep, no custom boundary component, zero `componentDidCatch`.
- Any uncaught render error = full app crash, no fallback UI.

### 6. Supabase types file — **MISSING**

- `types/` contains only `svg.d.ts`.
- No `database.ts`, `database.types.ts`, or `supabase.types.ts` anywhere.
- Every `.from('table')` call is untyped. Column typos are runtime bugs.
- Sprint 1 should generate one via `supabase gen types typescript` and wire it into
  `lib/supabase.ts` via `createClient<Database>(...)`.

### 7. Canonical conventions doc — **`AGENTS.md`**

- `CLAUDE.md` does **not** exist at the repo root. The session-start context that
  injected a `CLAUDE.md` was stale (file was apparently deleted previously).
- `AGENTS.md` is the only conventions doc on disk (219 lines). Future sessions should
  treat it as authoritative. A sibling project at `../adpt-coach-dashboard/` has its
  own `CLAUDE.md` — unrelated to this repo, do not conflate.
- Sprint 1 should add a short "house rules" section to `AGENTS.md`: no schema changes
  without a migration, no redefining DB types, error boundaries required on top-level
  layouts + active workout, PRs under ~400 lines, stop and ask on ambiguity.

### 8. Working tree — **CLEAN**

- Despite the session-start snapshot showing ~40 modified files, current
  `git status --short` shows only the four staged migrations from finding #3. No
  uncommitted in-flight work to worry about. Sprint 1 starts from a clean slate.

### 9. Staged migrations — **COMMIT + APPLY AS PART OF SPRINT 1**

- See finding #3 for the list. All four should be committed to the repo (`git add`
  is done; still need `git commit`) and applied to hosted Supabase before any
  coach-facing work begins in Sprint 2, since coach features depend on the 20260328
  tables.

### 10. Mid-workout crash risk — **CRITICAL**

- `src/context/ActiveWorkoutContext.tsx` (~900 lines) holds all in-progress workout
  state in a `useReducer` — exercises, completed sets, timer, rest state.
- Persistence happens **only** in `finishWorkout()` (a single insert transaction).
  Nothing hits AsyncStorage or Supabase mid-session.
- Real-world impact: a 45-minute leg day, RN crash on set 20 of 22 → entire session
  lost. No recovery, no resume, no draft.
- Sprint 1 minimum: checkpoint the reducer state to AsyncStorage after every set
  completion + on app background, and restore on mount if a draft exists. This is
  cheap and removes the scariest UX failure mode before coach clients ever touch it.

---

## Recommended Sprint 1 scope (for approval)

Aim: one PR, ≤400 lines of diff, titled `fix: sprint 1 stabilization`.

1. `git rm -r adpt/` (finding #1).
2. `git rm -r api/` + clean `package.json` references (finding #2).
3. Commit the four staged migrations so the repo is internally consistent
   (finding #9). Applying them to hosted Supabase is a separate manual step Troy runs.
4. Generate `types/database.ts` from hosted Supabase, wire into `lib/supabase.ts`
   (finding #6).
5. Add a single `ErrorBoundary` component under `src/components/` and mount it in
   `app/_layout.tsx`, `app/(app)/_layout.tsx`, and around `app/(workout)/active.tsx`
   (finding #5).
6. Add AsyncStorage checkpoint + restore in `ActiveWorkoutContext` (finding #10).
7. Append an "house rules for future sessions" section to `AGENTS.md` (finding #7).

**Out of scope for Sprint 1**: any coach features, nutrition work, theme changes,
schema edits beyond committing what's already staged, API refactors, new screens.

**Needs Troy's decision before I start**:
- Confirm `adpt/` and `api/` deletes (destructive — I will not run them without a
  go-ahead).
- Confirm types generation: do you want me to run `supabase gen types` (requires
  `supabase link`), or will you run it and paste the file?
- Confirm the AsyncStorage checkpoint approach is acceptable as a v1 fix (vs. a
  heavier "draft sessions in Supabase" approach that is more robust but larger).
