<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

# Karawhiua — Agent Operating Guide

Working reference for AI sessions on this repo. `AGENT_PROMPT.md` and
`BUILD_PLAN.md` are historical build context only — read for background, don't
treat as current instructions.

## Orchestration model

- **Claude Fable 5 is the orchestrator.** It owns planning, task breakdown,
  architectural decisions, security review, and final QA/sign-off on every
  change to this repo.
- Other models run as **sub-agents for scoped, well-defined implementation
  tasks only**. They do not make unsupervised architectural or
  security-relevant decisions.
- **Reasonable to delegate:** narrow codegen, boilerplate, repetitive
  refactors, isolated component work with a clear spec.
- **Never delegate without an explicit pre-merge review step:** anything
  touching auth, RLS policies, server functions, secrets, email sending, or
  data-sensitive flows. Default is Fable 5 does these directly.
- **Review loop is mandatory:** all sub-agent output is reviewed against this
  file's standards before commit. No blind acceptance. Reviewer runs
  `npx tsc --noEmit` and `npx eslint` on touched files at minimum.

## Stack facts (verify before assuming)

- TanStack Start (React 19 SSR via Nitro/Cloudflare), Vite 8 wrapped by
  `@lovable.dev/vite-tanstack-config` — do NOT add plugins it already includes
  (see comment in `vite.config.ts`).
- Supabase project `zxxhjkruhwjondrbftaf` (PostgreSQL + Auth + RLS + Storage).
  No Edge Functions — server logic lives in TanStack server functions
  (`createServerFn`).
- Routes: flat files in `src/routes/` (`admin.users.tsx` → `/admin/users`).
  Role gates: `_authenticated` → `_admin` (school_admin, super_admin) →
  `_superadmin`.
- UI: shadcn/ui in `src/components/ui/`, feature code in `src/modules/`,
  data services in `src/models/`.

## Security rules (non-negotiable)

- **Server functions:** every `createServerFn` that reads private data or uses
  `supabaseAdmin` MUST use `requireSupabaseAuth` middleware plus an explicit
  role check on the caller's `users` row (pattern:
  `src/modules/admin/actions/fetchUserEmails.ts`). The service-role client
  bypasses RLS — treat every use as privileged.
- **Email:** `sendEmailServer` (`src/lib/sendEmail.ts`) is server-only and must
  never be re-exposed as a public server function. New email sends go through
  narrow, authenticated server functions that derive recipient + content
  server-side (`src/lib/emails.functions.ts`).
- **Secrets:** never commit `.env` (gitignored; keep `.env.example` in sync
  with required vars, placeholders only). `VITE_`-prefixed vars ship to the
  browser — publishable keys only. If a secret ever lands in git, rotate it at
  the provider; deleting the file does not remove it from history.
  Known debt: a Resend API key was committed historically — assume rotated;
  never reuse keys found in history.
- **No secrets in client code:** anything instantiated in components (e.g.
  Gemini in `AIBadgeGenerator`) ships its key in the JS bundle. AI/API calls
  needing private keys belong in authenticated server functions.
- **RLS discipline:** every new table gets explicit RLS policies before
  shipping, scoped `TO authenticated` (or tighter) unless anon access is
  deliberate. No `USING (true)` for all operations without an inline SQL
  comment justifying it. This app holds children's PII — default closed.
  Known debt: `users` still has a public `FOR SELECT USING (true)` policy
  from migration 001 that needs a scoping migration.
- **User input:** never interpolate user input into PostgREST `.or()`/filter
  strings without validating the charset first.

## Secure-PWA maintenance

- Service worker is hand-rolled at `public/sw.js`; manifest at
  `public/manifest.webmanifest`; icons in `public/icons/` (regenerate from
  `public/KarawhiuaLogo.png` if the logo changes; keep maskable variants).
- **Bump `CACHE_VERSION` in `sw.js` whenever precached files or caching logic
  change** — stale caches are the top PWA regression.
- Never cache `/_serverFn`, `/api/`, or cross-origin (Supabase) responses.
- After any route or shell change, re-test: production build → SW activates →
  offline navigation serves `/offline.html` → hard refresh works. CDP
  `Page.getInstallabilityErrors` should stay empty (incognito error aside).
- iOS meta tags live in `src/routes/__root.tsx` head() — keep them when
  editing meta.

## Quality gates before any commit

- `npx tsc --noEmit` passes; `npx eslint` clean on touched files.
- `npm audit` when `package.json` changes; fix high/critical before merge.
- **Branding:** new UI pulls from tokens in `src/styles.css`
  (`--brand-*`, `--primary`, Tailwind classes like `bg-primary`,
  `text-brand-green`) — no new hardcoded hex values.
  Known debt: legacy components hardcode `#0B4B39` while the token is
  `#0A4B39`; don't add more of either.
- **Links/routes:** every new page must be reachable from real navigation (or
  explicitly flagged as intentionally unlisted in the PR description). Every
  `<Link>`/`navigate()` target must exist in `src/routes/`. External links
  with `target="_blank"` need `rel="noopener noreferrer"`.
- Keep commits scoped per concern; never force-push (Lovable notice above).
