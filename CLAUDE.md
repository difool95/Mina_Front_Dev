# Mina — Frontend

Instructions for Claude working in this repo. Follow them on every file you create.

## 0. Write the least code possible

The highest priority rule, above every convention below. Reuse before you write.

- Before adding anything, search for what already exists and use it. A new helper that duplicates an existing one is a bug.
- Prefer the platform: native CSS, native DOM APIs, native HTML elements. Reach for a library only when the hand-rolled version would be materially worse.
- No abstraction until there is a second caller. No wrapper that only forwards props. No barrel file for one export. No `try/catch` that only rethrows.
- No defensive branches for states that cannot happen, no options nobody passes, no premature generalisation.
- Delete rather than comment out. Comment only what the code cannot say itself — the *why*, never the *what*.
- The smallest diff that fully solves the problem wins. If a change feels large, question the approach before writing it.

## 1. Project state

Greenfield. Built from scratch together with the user — assume nothing exists until you have read it.

- **This repo** (`Mina_Front_Dev`) — React + Vite + TypeScript SPA.
- **`Mina_Back_Dev`** (sibling folder) — Express / Node API. Reached only through `services/`.
- **Supabase** — database, auth and storage. May be called directly from `services/` without going through the Express API.

## 2. Stack

| Concern | Library |
|---|---|
| Build / framework | Vite + React + TypeScript |
| Routing | `react-router-dom` |
| Server state | `@tanstack/react-query` |
| DB / auth / storage | `@supabase/supabase-js` |
| Styling | Plain CSS + the design tokens in `src/index.css` |
| i18n | `i18next` + `react-i18next` |
| Validation | `zod` |

**Do not add a dependency outside this table without asking the user first.**

### Styling rules

- All colour, type, spacing and motion values come from the `--mina-*` custom properties on `:root` in `src/index.css`. **Never hard-code a hex, px font-size, or duration** that a token already covers.
- The Design Cockpit overrides these tokens at runtime, so reading a token is what makes a component themeable. Bypassing it silently breaks theming.
- One `.css` file next to the component it styles, imported by that component. No CSS-in-JS, no utility framework.
- Class names are `mina-<block>__<element>`, flat, no nesting deeper than one level.

## 3. Folder map

```
src/
├── components/   Reusable TSX used by pages and other components
├── config/       env.ts — every environment variable, validated
├── hooks/        useXxx — React state logic + React Query wrappers
├── lib/          Pure helpers, formatters, constants, static data
├── pages/        One route-level component per route
├── providers/    App-wide context the app needs to run
├── services/     The only layer that makes network calls
└── types/        Models — interfaces, types, enums
```

Nothing else goes directly in `src/` except `main.tsx`, `App.tsx`, `index.css` and `vite-env.d.ts`.

## 4. Folder rules

### `components/`

- **Put here** — any TSX rendered in more than one place, or extracted to keep a page readable. Layout, forms, cards, tables, modals.
- **Never here** — data fetching. No `supabase` import, no `fetch`, no service import. Data arrives via props or a hook.
- **Naming** — `PascalCase.tsx`, one component per file, named export. Once a component grows siblings (styles, sub-parts, tests), promote it to `components/Booking/` with an `index.ts`.
- `components/ui/` is reserved for shadcn/ui primitives. Do not hand-edit files there beyond theme tokens.

### `config/`

- **Put here** — `env.ts` only, plus static app configuration that depends on env (feature flags, route constants that read env).
- **`env.ts` is the only file in `src/` allowed to read `import.meta.env`.** Parse it through a `zod` schema and export the frozen result, so a missing variable throws at boot instead of surfacing as `undefined` three screens deep.
- **Never here** — secrets, or anything that changes at runtime.
- **Naming** — `camelCase.ts`.

### `hooks/`

- **Put here** — reusable React logic, and one domain hook per data concern wrapping React Query (`useBookings`, `useCurrentUser`). Hooks call `services/`.
- This is the **only seam between UI and the network**. If a component needs server data, it gets a hook.
- **Never here** — raw `supabase` or `fetch` calls; go through `services/`. No JSX.
- **Naming** — `useXxx.ts`, one hook per file, matching the filename.

### `lib/`

- **Put here** — pure functions and static data: formatters (`formatDate`, `formatPrice`), validators, query-key factories, constants, enums-as-data, static lists (nav items, countries, categories).
- **Never here** — anything that imports `react` (that is a hook or a component), and anything that makes a network call (that is a service).
- **Naming** — `camelCase.ts`, grouped by subject (`date.ts`, `format.ts`, `constants.ts`, `navigation.ts`).

### `pages/`

- **Put here** — exactly one component per route. Pages compose components and call hooks.
- **Never here** — a `services/` or `supabase` import. A page that needs data calls a hook. No component reused by another page (that goes in `components/`).
- **Naming** — `XxxPage.tsx` (`LoginPage.tsx`, `BookingsPage.tsx`). Nest by route shape when routes nest: `pages/bookings/BookingDetailPage.tsx`.

### `providers/`

- **Put here** — context the whole app depends on to function: `QueryProvider`, `AuthProvider`, `I18nProvider`, `ThemeProvider`. Each exports the provider component and its `useXxx` context hook.
- **Nesting order in `main.tsx`** — keep this order; each layer depends on the ones outside it:

```tsx
<QueryProvider>      {/* Auth needs the query client */}
  <AuthProvider>     {/* routes need the session */}
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </AuthProvider>
</QueryProvider>
```

- **Never here** — feature-scoped context used by one page; keep that next to its feature.
- **Naming** — `XxxProvider.tsx`.

### `services/`

- **Put here** — **the only layer permitted to make a network call.**
  - `supabase.client.ts` — the single shared Supabase client. Create it once, here.
  - `api.client.ts` — thin wrapper over `fetch` for the Express backend; attaches the base URL and auth header.
  - `xxx.service.ts` — one module per domain (`auth.service.ts`, `bookings.service.ts`). A service may talk to Supabase, to our Express API, or straight to a third party — whichever that domain actually uses.
- Every function takes and returns types from `types/`, and throws one normalized error shape so hooks never parse vendor-specific errors.
- **Never here** — React imports, JSX, hooks, or component state.
- **Naming** — `xxx.service.ts` with named exports (`getBookings`, `createBooking`).

### `types/`

- **Put here** — anything with a shape: domain models, Supabase row types, API request/response bodies, form values, shared unions.
- **Naming** — `PascalCase` names, **no `I` prefix**. `interface` for object shapes, `type` for unions and aliases. Files are `xxx.types.ts` (`booking.types.ts`), re-exported from `types/index.ts`.
- **Never here** — runtime values. A `const` array of options is static data and belongs in `lib/`; only its type belongs here.

## 5. Data flow

```
Page  →  hook  →  service  →  Supabase / Express API / third party
  ↑        ↑         ↑
components └─────────┴──  types/ are shared by every layer
```

Data moves down through that chain and back up. Never short-circuit it.

## 6. Import direction

Import **downward only**. Each folder may import from the folders on its row and nothing above it.

| Folder | May import from |
|---|---|
| `types/` | *nothing* (leaf) |
| `config/` | `types` |
| `lib/` | `types`, `config` |
| `services/` | `types`, `config`, `lib` |
| `hooks/` | `types`, `config`, `lib`, `services` |
| `providers/` | `types`, `config`, `lib`, `services`, `hooks` |
| `components/` | `types`, `config`, `lib`, `hooks`, `providers`, `components` |
| `pages/` | everything except other `pages/` |

Two hard rules:

1. **Never import upward.** A component may not import a page; a service may not import a hook.
2. **Never skip the hook layer.** A component or page may not import from `services/`.

If a rule blocks you, the code is in the wrong folder — move it, do not bypass the rule.

## 7. Environment variables

Read only in `config/env.ts`, via a `zod` schema.

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / public key |
| `VITE_API_BASE_URL` | Express backend base URL (`Mina_Back_Dev`) |
| `VITE_APP_ENV` | `development` / `staging` / `production` |

- Vite only exposes variables prefixed **`VITE_`**. Anything without it is invisible to the client.
- `.env` is gitignored. `.env.example` is committed with every key present and all values blank.
- **Only the anon key ever goes in this bundle.** Everything in `import.meta.env` is compiled into JavaScript the browser downloads. `service_role` keys and any other secret belong in the Express backend, never here.
- Adding a variable means three edits: `.env`, `.env.example`, and the schema in `config/env.ts`.

## 8. Naming summary

| Thing | Convention | Example |
|---|---|---|
| Component / page / provider file | `PascalCase.tsx` | `BookingCard.tsx` |
| Hook file | `useXxx.ts` | `useBookings.ts` |
| Service file | `xxx.service.ts` | `bookings.service.ts` |
| Types file | `xxx.types.ts` | `booking.types.ts` |
| Helper / config file | `camelCase.ts` | `formatDate.ts` |
| Page component | `XxxPage` | `BookingsPage` |
| Type / interface | `PascalCase`, no `I` prefix | `Booking`, not `IBooking` |
| Boolean prop or state | `is` / `has` / `can` prefix | `isLoading` |

Prefer named exports everywhere. Default-export only where a tool requires it.

## 9. Path alias

`@/` resolves to `src/`. Import as `@/components/BookingCard`, never `../../components/BookingCard`.

Declared in two places — both must agree:

- `vite.config.ts` → `resolve.alias`
- `tsconfig.json` → `compilerOptions.paths`

## 10. Adding a feature

Work bottom-up so each layer compiles against the one below. For a "Bookings" feature:

1. `types/booking.types.ts` — the model. Export from `types/index.ts`.
2. `services/bookings.service.ts` — `getBookings`, `createBooking`. Typed in and out.
3. `lib/queryKeys.ts` — add the `bookings` key factory.
4. `hooks/useBookings.ts` — React Query wrapper over the service.
5. `components/BookingCard.tsx` — presentational, props only.
6. `pages/BookingsPage.tsx` — calls `useBookings`, renders `BookingCard`.
7. Register the route in the router, and add i18n keys for any new copy.

Before finishing, check the change against §6. If any import points upward or skips the hook layer, fix the placement.
