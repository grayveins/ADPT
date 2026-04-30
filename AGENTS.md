# AGENTS

This repository contains two TypeScript projects:
- Expo/React Native app in the repo root (Expo Router).
- Fastify API in `api/` (TypeScript + Zod + Supabase).
These notes capture existing conventions so agentic tools can blend in.

## Repository map
- app/ : Expo Router screens and layouts (file-based routes).
- components/ : shared UI components (Themed* etc.).
- constants/ : theme tokens (`colors`) and static values.
- hooks/ : shared hooks (theme, tab overflow).
- lib/ : client helpers (Supabase client, authed fetch).
- assets/ : images, fonts.
- api/ : Fastify server (separate package.json).

## Commands (root app)
- Install: `npm install`
- Dev server: `npm run start` (alias for `expo start`).
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`
- Lint: `npm run lint` (Expo ESLint flat config).
- Reset starter: `npm run reset-project` (moves starter to app-example).
- Build: no dedicated script; use Expo/EAS if needed.

## Commands (api/)
- Install: `npm install`
- Dev: `npm run dev` (ts-node-dev on `src/server.ts`).
- Build: `npm run build` (tsc -> dist/).
- Start: `npm run start` (node dist/server.js).
- Lint: none configured.

## Tests
- No test runner configured in root or api packages.
- If you add Jest later, a single-test run usually looks like:
  `npx jest path/to/test -t "test name"`
  (only after installing/configuring Jest).

## Environment variables
- Mobile app expects Expo public vars (from `.env`):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_BASE`
- API service expects server secrets (see `api/.env`):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `OPENAI_API_KEY`, `OPENAI_MODEL` (optional override)
  - `PORT` (API port)
- Never commit secrets; keep `.env` files local.

## Formatting & lint
- ESLint uses `eslint-config-expo/flat`; `dist/` is ignored.
- No Prettier config; avoid mass reformatting.
- Indentation is 2 spaces; semicolons are used consistently.
- Quote style is mixed (single in templates, double in custom screens).
  Follow the file's existing quote style when editing.

## Imports
- Order generally: React/React Native, third-party, local.
- Use `import type` for types when possible (see components).
- Prefer `@/` path alias for shared modules (configured in tsconfig).
- Relative imports are common in `app/`; keep local patterns.

## TypeScript
- `strict: true` in both app and api tsconfigs.
- Prefer explicit types for state and API payloads.
- Use `type` for union/data shapes; `interface` for contexts if needed.
- Avoid `any` except at boundaries (e.g., `req.body`).

## React Native app conventions
- Expo Router file-based routing in `app/`.
- Screens are default exports; components are named exports.
- Route file names are kebab-case; components use PascalCase.
- Use `router.push/replace` or `<Redirect>` for navigation.
- Typed routes enabled (`app.json` -> `experiments.typedRoutes`).
- `app/_layout.tsx` wraps providers (OnboardingProvider).
- Tabs are defined in `app/(app)/(tabs)/_layout.tsx`.

## Navigation & params
- Keep route strings aligned with file names (case and dashes).
- Use `useLocalSearchParams` for query/route params.
- Prefer `router.replace` for auth/onboarding redirects.

## UI & styling
- UI uses React Native components + inline style objects.
- For larger style blocks, `StyleSheet.create` is common.
- Theme tokens live in `constants/Colors.ts` (`colors`) and `src/theme.ts`.
- Shared themed components: `components/ThemedText`, `ThemedView`.
- Prefer `SafeAreaView` for full-screen layouts.
- Keep visual tokens centralized; avoid hard-coded colors unless local.

## Design System - Teal/Cyan Theme (v3)

### Philosophy: "PT in Your Pocket"
- Dark mode default (gym-readable, professional)
- Teal/Cyan primary (trust + energy, gender-neutral)
- Scientific, minimal, approachable
- HCI-compliant touch targets (56pt primary, 48pt secondary)

### Color Palette
Primary theme files:
- `src/theme.ts` - Full design system (preferred for new code)
- `constants/Colors.ts` - Legacy API (backward compatible)

**Dark Mode (DEFAULT):**
- Primary: `#00C9B7` (Teal/Cyan) - CTAs, progress rings
- Success: `#7FA07F` (Sage Green) - completed states
- Intensity: `#FF6B35` (Orange) - rest timer, urgency
- Gold: `#FFD700` (Gold) - PRs, achievements, streaks
- Background: `#0A0A0A` (Near-black)
- Card: `#1C1C1C`
- Text: `#F5F5F5`
- TextOnPrimary: `#0A0A0A` (dark text on teal buttons)

**Light Mode (toggle in settings):**
- Primary: `#00A89A` (Slightly darker teal)
- Background: `#FAFAFA`
- Text: `#171717`
- TextOnPrimary: `#FFFFFF`

### Input Scales
**Effort Scale (5 levels, filled circles):**
```
effortScale.easy     = ○○○○○  RIR 4+  "Could do 4+ more"
effortScale.moderate = ●○○○○  RIR 3   "Could do 3 more"
effortScale.hard     = ●●○○○  RIR 2   "Could do 2 more"
effortScale.veryHard = ●●●○○  RIR 1   "Could do 1 more"
effortScale.failure  = ●●●●●  RIR 0   "Couldn't do another"
```

**Feeling Scale (keep emojis for pre-workout):**
```
feelingScale.tired  = 😴 "-10% weights"
feelingScale.normal = 😊 "As planned"
feelingScale.strong = 💪 "+10% weights"
```

### Touch Targets (HCI Standards)
- Primary CTAs: 56pt (gym-friendly)
- Secondary actions: 48pt
- Minimum: 44pt

### Spacing (base 4px)
- `xs: 4`, `sm: 8`, `md: 12`, `base: 16`, `lg: 20`, `xl: 24`, `xxl: 32`

### Border Radius
- `sm: 8`, `md: 12`, `lg: 16`, `xl: 20`, `xxl: 24`, `pill: 999`

### Typography
- Font: System (iOS) / Roboto (Android)
- Sizes: largeTitle(34), title1(28), title2(22), body(17), footnote(13)

### Design Guidelines
- Dark mode is default - gym-readable
- Use `colors.intensity` for rest timer, urgency (not hardcoded orange)
- Use `colors.gold` for PRs, trophies, achievements (not hardcoded #FFD700)
- Success/completion always uses sage green
- Always use `useTheme()` hook - never import `darkColors` directly
- No confetti in onboarding (removed for cleaner experience)

## Assets & icons
- App images live in `assets/images`.
- Icons commonly come from `@expo/vector-icons` (Ionicons).
- Use `expo-image` for remote images where possible.
- Keep asset paths relative to repo root.

## State & performance
- Prefer `useMemo` and `useCallback` for derived data and handlers.
- Keep heavy computations out of render.
- Clean up subscriptions in `useEffect` cleanup functions.
- Co-locate component state near usage; lift only when shared.

## Forms & UX
- Validate user input before navigation or API calls.
- Use `Alert.alert` for blocking user errors.
- Provide loading states via `useState` and disabled buttons.

## Data & networking (mobile)
- Supabase client is in `lib/supabase.ts`; never embed keys directly.
- Use `authedFetch` from `lib/api.ts` for API calls (adds JWT).
- Manage async state with `try/catch/finally`.
- Log unexpected errors with `console.error`.

## Backend API conventions (api/)
- Fastify is used; routes live in `api/src/routes/*`.
- Request validation uses Zod schemas.
- Use `reply.code(400).send({ error })` for validation errors.
- Prefer throwing Supabase errors and letting Fastify handle.
- `api/src/server.ts` is the current dev/build entry.
- `api/src/index.ts` contains auth + Postgres flow; verify usage before editing.
- DB helpers: `api/src/db.ts` provides `pg()` with pooled connections.
- Supabase service role client in `api/src/lib/supabase.ts`; server-only.

## Naming & structure
- Variables/functions: camelCase.
- Types: PascalCase.
- Constants: camelCase or UPPER_SNAKE for env-derived values.
- Keep modules focused; colocate helper types near usage.

## Error handling & logging
- Mobile: surface actionable errors with `Alert.alert`.
- API: log with `app.log.error` or `console.error` on startup failures.
- Always clean up loading state in `finally`.

## Cursor/Copilot rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## When adding new code
- Match the surrounding file's style (quotes, spacing, hooks usage).
- Keep UI logic in screens, shared logic in `lib/` or hooks.
- Prefer small, composable components over long screens.
- Ensure route strings align with file paths.
- Avoid editing lockfiles unless dependency changes are required.

## House rules (Sprint 1+)
- **No schema changes without a migration.** Every table/column change must have a
  corresponding file in `supabase/migrations/`. Never modify hosted Supabase directly.
- **No redefining DB types.** Use the generated `types/database.ts` — don't create
  inline type aliases that duplicate column definitions.
- **Error boundaries required** on top-level layouts and the active workout screen.
  New top-level routes must be wrapped in `<ErrorBoundary>`.
- **PRs under ~400 lines of diff.** If heading past 500, split.
- **Stop and ask on ambiguity.** Don't guess on schema, auth, or destructive changes.
- **`api/` is deleted.** Mobile talks directly to Supabase. Don't recreate a Fastify
  server unless the product requires server-side logic beyond edge functions.
- **`adpt/` is deleted.** It was a stale duplicate. Don't recreate.
- **Design direction:** light mode default, blue primary, MacroFactor + Hevy minimalism.
  Use `useTheme()` — never hardcode colors.

## Useful references
- `README.md` for Expo start instructions.
- `app.json` for app metadata and typed routes.
- `eslint.config.js` for lint configuration.
