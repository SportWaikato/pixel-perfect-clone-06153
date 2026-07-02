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

# AGENTS.md — Karawhiua Virtual Sports Day (pixel-perfect-clone-06153)

## Stack
- **Framework:** TanStack Start (SSR) on Vite 8
- **Routing:** TanStack Router (file-based, auto-generated `routeTree.gen.ts`)
- **UI:** React 19 + shadcn/ui + Tailwind CSS v4
- **Auth:** Supabase (SSR via `@supabase/ssr`)
- **Database:** Supabase PostgreSQL (migrations in `supabase/migrations/`)
- **Server:** Nitro (Cloudflare deployment target)
- **Config wrapper:** `@lovable.dev/vite-tanstack-config` — do NOT add manually managed plugins that it already bundles (tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, componentTagger, env injection, @ alias, React/TanStack dedupe).

## Key Files
| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + TanStack Start config |
| `src/router.tsx` | Router creation with query client |
| `src/start.ts` | TanStack Start entry + error middleware |
| `src/server.ts` | SSR server entry (error wrapper) |
| `src/routes/__root.tsx` | Root shell, meta tags, auth listener |
| `src/routes/auth.tsx` | Login/signup page |
| `src/routes/_authenticated/` | Protected routes (auth context) |
| `src/routes/_authenticated/_admin/` | School admin routes |
| `src/routes/_authenticated/_superadmin/` | Superadmin routes |
| `src/routes/register-school.tsx` | School registration flow |
| `src/styles.css` | Active Tailwind CSS + brand tokens |
| `src/styles-from-nextjs.css` | Legacy Next.js port reference (not loaded) |
| `src/integrations/supabase/` | Supabase client, types, middleware |
| `src/lib/emails.functions.ts` | Email sending functions |
| `supabase/migrations/` | SQL migrations (sequential) |

## Route Structure
Routes follow TanStack Router file conventions:
- `auth.tsx` — public auth page (login/signup)
- `forgot-password.tsx` — password reset request
- `reset-password.tsx` — password reset handler
- `_authenticated/` — wrapper for authenticated routes (checks auth, redirects to `/auth`)
  - `dashboard.tsx` — main dashboard (Kia ora {name} + profile card)
  - `onboarding.tsx` — post-auth setup flow
  - `profile.tsx`, `settings.tsx`, `achievements.tsx` — user pages
  - `admin/` — school admin pages (pending, users, school settings)
  - `_superadmin/` — superadmin pages (schools, users, surveys, analytics placeholder)
- Public signup: `join.$code.tsx`, `register-school.tsx`
- Public info: `onboarding.tsx` (unauthenticated)

## Design System
### Brand Colors
Defined in `src/styles.css` as CSS variables:

| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-primary-green` / `--primary` | `#0a4b39` | Primary buttons, headers |
| `--brand-supporting-green` / `--ring` | `#118061` | Focus rings, hover states |
| `--brand-magenta` / `--accent` | `#d103d1` | Accent, highlights |
| `--brand-pink` | `#db4fdb` | Secondary accent |
| `--brand-grey` / `--background` | `#f5f5f0` | Page background |
| `--brand-dark-grey` / `--foreground` | `#333333` | Body text |
| `--destructive` | `#b600b8` | Errors, destructive actions |

**⚠️ KNOWN DISCREPANCY:** Some components hardcode `#0B4B39` (from the original Next.js reference, `styles-from-nextjs.css`) instead of `#0a4b39` (active `styles.css`). These should be reconciled. Files affected: `AchievementsGrid.tsx`, `LogActivityForm.tsx`, `ActivityHistory.tsx`. Similarly, `#0F8061` is used in components (`activityIcons.tsx`, `EventsContent.tsx`, `NavigationProgress.tsx`) while `styles.css` uses `#118061`.

### Components
- shadcn/ui primitives under `src/components/ui/` (generated, do not hand-edit)
- Custom components under `src/modules/` (auth, admin, application)

## PWA Status
- `vite-plugin-pwa` installed and configured in `vite.config.ts`
- Service worker: auto-update with Workbox (cache-first for assets, NetworkFirst for Supabase API)
- Manifest: Karawhiua branding, theme-color `#0a4b39`
- Icons: `/pwa-192x192.png`, `/pwa-512x512.png` (generated from `KarawhiuaLogo.png`)
- iOS: meta tags added to `__root.tsx`
- **Missing:** Proper maskable icon (custom design with padding), offline fallback page, periodic sync for Supabase data

## Common Commands
```bash
npm run dev       # Start dev server (localhost:8080)
npm run build     # Production build (Vite + Nitro)
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Security Posture
- RLS enabled on all tables
- Open redirect protection on auth page (commit `35a0d36`)
- Input validation on `register-school.tsx` step 1 (commit `35a0d36`)
- `.env` untracked, `.env.example` with placeholder values
- All `target="_blank"` links use `rel="noopener noreferrer"`
- No `dangerouslySetInnerHTML` on user content

### Open Issues
1. **`user_achievements` RLS:** INSERT `WITH CHECK (true)` — any authenticated user can insert achievement claims. Needs policy restriction.
2. **Public SELECT access:** `schools`, `houses`, `users`, `activities`, `events`, `achievements` readable by anonymous role. Intentional for MVP but should be reviewed before public launch.
3. **RESEND_API_KEY rotation:** Old key still in git history (visible in blob from prior commits before untracking). Rotate in Resend dashboard.

## Deployment
- Hosted via Lovable's Cloudflare pipeline
- Supabase project: `zxxhjkruhwjondrbftaf` (region: ap-southeast-1)
- Edge functions managed through Lovable — no local `supabase/functions/` directory in this repo

## Unused Template Assets
The following files in `public/` are leftover from the Lovable/Vite template and are unused: `next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`. Consider removing them.
