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

## Design System - Warm Coral Theme

### Philosophy: "Premium but Approachable"
- Warm, welcoming colors (not cold/sporty/intimidating)
- Light mode default (less intimidating for beginners)
- Generous spacing and rounded corners (16-24px radius)
- Trust through transparency ("Why this workout?" explanations)

### Color Palette
Primary theme files:
- `src/theme.ts` - Full design system (preferred for new code)
- `constants/Colors.ts` - Legacy API (backward compatible)

**Light Mode (Default):**
- Primary: `#FF7A5C` (Warm Coral) - CTAs, progress rings
- Success: `#6B8E6B` (Sage Green) - completed states, PRs
- Background: `#FDFCFB` (Warm White)
- Text: `#1C1917` (Warm Black)
- Card: `#FFFFFF`
- Border: `#E8E4DF`

**Dark Mode:**
- Primary: `#FF8B70` (Lighter Coral for contrast)
- Success: `#7FA07F` (Lighter Sage)
- Background: `#121110` (Warm Black)
- Text: `#F5F4F2` (Off-White)

### Emoji-Based Input Scales
**Effort Scale (RIR - Reps in Reserve):**
```
effortScale.easy  = 😊 "Could do 4+ more"
effortScale.good  = 😐 "Could do 2-3 more"
effortScale.hard  = 😤 "Could do 1 more"
effortScale.max   = 🔥 "Couldn't do more"
```

**Feeling Scale (Daily Readiness):**
```
feelingScale.tired  = 😴 "-10% weights"
feelingScale.normal = 😊 "As planned"
feelingScale.strong = 💪 "+10% weights"
```

### Spacing (base 4px)
- `xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32`, `xxl: 40`

### Border Radius
- `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `pill: 999`

### Typography
- Font: Inter family (or System fallback)
- Sizes: hero(48), h1(32), h2(24), h3(20), body(16), caption(12)

### Design Guidelines
- Avoid pure black (#000) - use warm blacks (#1C1917, #121110)
- Avoid pure white for backgrounds - use warm whites (#FDFCFB)
- Cards should have subtle warm shadows, not harsh
- Use coral sparingly for emphasis, not everywhere
- Success/completion always uses sage green
- Errors use standard red (#EF4444 light, #F87171 dark)

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

## Useful references
- `README.md` for Expo start instructions.
- `app.json` for app metadata and typed routes.
- `eslint.config.js` for lint configuration.
