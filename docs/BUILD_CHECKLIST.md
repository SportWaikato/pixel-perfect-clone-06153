# Karawhiua Build-Out — Phase 1 Inventory & Test Plan

Status date: 2026-07-03. Legend: ✅ verified working · 🟡 renders/compiles but functionally
unverified (needs live Supabase + test accounts) · 🔴 built but broken · ⬜ not built.
"Verified" means click-tested in a browser, not code-read.

## Update — build session 2 (2026-07-03, later)

Fixed this session (all 🟡 until click-verified against live Supabase):
- Registration rollback: real server-side `cleanupOwnFailedRegistration` (the
  browser can never call `auth.admin`); wired into both failure paths.
- `/admin` super-admin dashboard wired to real data (was a stub).
- `/admin/assembly/present` route created — assembly Present flow now resolves;
  school admins pinned to their own school.
- `/admin/updates` built (super-admin school updates management).
- AI badge generation moved into an authed super-admin-only server function
  (`GOOGLE_AI_API_KEY`, server-side); no code path reads a `VITE_` Gemini key.
- School-admin dashboard: houses/allowlist cards hidden for school admins
  (pages only exist under the _superadmin gate — decide later if /school
  equivalents are wanted).
- `koorero` duplicate module/model removed (`korero` canonical).
- Removed the parallel-added vite-plugin-pwa stack (unregistered SW, sw.js
  collision, cached Supabase responses) — hand-rolled SW stays canonical,
  rebranded to #1B5E4B, CACHE_VERSION → v2, re-verified offline in Chromium.
- Canonical green = **#1B5E4B** (set deliberately in styles.css on main);
  last two stragglers normalized; repo is hex-consistent.
- Badges: 17.7 MB → 1.5 MB in-place (filenames unchanged — DB references).
- Tap targets ≥44px on mobile (base button/input/tabs, verified 0 sub-44px
  on /auth); the two genuinely-missing `alt` cases were `<img />` bugs → now
  lucide `Image` icons.
- Two new security migrations staged for YOU to apply (see
  `docs/SUPABASE_RUNBOOK.md`): same-school users SELECT scoping + tightened
  `school-updates` storage bucket writes.

New flags:
- `public/badges/Unlocked-Technology-logging-VR-Gamefit.png` is a 0-byte file
  and `Unlocked-Technology-logging-VR` (no extension) is undecodable — both
  left in place; confirm delete/replace.
- SchoolAdminDashboard generates sign-up URLs at `/schools/$id/signup` — no
  such route exists (relates to orphaned `SchoolSpecificSignUpForm`). QR code
  and copy-link features produce dead URLs. ⬜ build or repoint.
- Hydration warning re-check on `/` still blocked (live URL unreachable from
  sandbox).
- Schema reconciliation (drifted tables/RPCs) requires `supabase db pull` by a
  project owner — runbook step 2.

Verification blockers for 🟡 items (fix these first):
1. Sandbox network policy blocks `*.supabase.co` — allow it in the Claude Code environment.
2. Supabase MCP needs auth: claude.ai connector lacks project access; the project-scoped
   server in `.mcp.json` needs its OAuth run once from an interactive session (`/mcp`).
3. Need test accounts (student, school_admin, super_admin) or approval to create them.

## A. Public / auth surface

| Item | Status | Notes |
| --- | --- | --- |
| `/` redirect logic | ✅ | Redirects by auth/profile state |
| `/auth` sign-in + sign-up forms | ✅ UI / 🟡 submit | Layout verified both viewports; Supabase submit untested |
| Google OAuth flow | 🟡 | `auth.callback` + register-school OAuth restore untested |
| `/forgot-password`, `/reset-password` | ✅ UI / 🟡 submit | |
| `/register-school` 4-step wizard | 🟡 | Step validation works; DB writes + RLS untested. 🔴 rollback calls `supabase.auth.admin.deleteUser` from browser — can never work, move server-side |
| `/join/$code` | 🟡 | Uses `lookup_school_by_join_code` RPC (not in repo migrations) |
| `/onboarding` 3-step student flow | 🟡 | Upserts `users` row; welcome email via new authed server fn |
| 404 page | ✅ | Branded, correct status |
| PWA (manifest/SW/offline/install) | ✅ | Verified against production build |

## B. Student area (all 🟡 — render untested against live data)

`/dashboard`, `/activities` (log + history), `/events` + `/events/$id` (challenges),
`/achievements`, `/feed`, `/korero`, `/leaderboard`, `/profile`, `/survey`,
`/challenges/my-suggestions`.

Known specifics:
- Challenge cards + detail navigation ✅ (fixed this audit — was 404ing).
- Surveys depend on 4 tables absent from repo migrations (see D).
- `/korero`: repo has BOTH `src/modules/korero/` and `src/modules/koorero/` — likely one is
  legacy; needs decision.
- Streaks/points depend on RPCs (`calculate_user_streak`, `get_user_current_month_progress`,
  `get_term_points`) — last one absent from repo migrations.

## C. Admin areas

School admin (`/school/*`): dashboard ✅ links fixed this audit; users, events, updates,
feed, leaderboard, activity, assembly, messages all 🟡.
- 🔴 Dashboard still links `/admin/houses` + `/admin/allowlist` (super-admin-only routes —
  school admins get bounced; no `/school` equivalents exist). Decide: build or hide.

Super admin (`/admin/*`): schools, schools/pending, users, events, houses, badges, media,
surveys, invites, allowlist, deleted-users, audit-log, reports, settings, assembly 🟡.
- 🔴 `/admin` dashboard is a stub (`schools=[]`, `@ts-expect-error` in route) — needs data wiring.
- 🔴 Assembly "Present" navigates to `/admin/assembly/present` — route doesn't exist;
  `AssemblyPresentationContent` + `SocialFeedSlide` built but never wired. ⬜ route + data fetch.
- 🔴 `SuperAdminMessagesSection` links to `/admin/updates` — page doesn't exist. ⬜
- `/admin/analytics` is an intentional "coming soon" placeholder (per AGENT_PROMPT 5F).
- 🔴 `AIBadgeGenerator` instantiates Gemini client-side (`VITE_GOOGLE_AI_API_KEY` would ship
  in bundle) — move to authed server fn.

Orphaned (flagged, awaiting delete/wire decision): legacy `modules/auth` forms (LoginForm,
SignUpForm, SchoolSpecificSignUpForm, ForgotPasswordForm, ResetPasswordForm), AdminLayout,
ManageContentContent, ChallengeProgressBar, KooreroVotingForm, InviteRegistrationForm (no
`/invite` route), UserPageSkeleton, AdminPageSkeleton, NavigationProgress, KarawhiuaLogoOld.png,
Next.js template SVGs, ~20 unused shadcn primitives.

## D. Supabase side (from repo migrations; live DB NOT yet verified — access blocked)

In migrations (20 tables): schools, houses, users, activities, events, event_participants,
achievements, user_achievements, activity_type_aliases, allowed_emails, blocked_emails,
korero_votes, promotional_assets, school_admins, school_messages, school_terms,
school_update_reads, school_updates, super_admin_invites, assembly_draw_winners.

**Drift — used by frontend but in NO repo migration** (live-DB-only; a fresh DB from these
migrations cannot run the app):
- Tables: `surveys`, `survey_questions`, `survey_responses`, `user_survey_status`,
  `audit_log`, `badges`, `house_achievements`.
- RPCs: `get_school_join_code`, `lookup_school_by_join_code`, `get_term_points`,
  `reset_term_points`, `increment_feed_like`, `get_audit_log`, `get_unique_user_report`.
- Action: dump live schema (`supabase db pull` or MCP) and commit reconciliation migrations.

RLS priority fixes (need migrations — flagged, not applied):
1. 🔴 `users` `FOR SELECT USING (true)` (migration 001, never dropped) — children's PII
   readable with anon key alone. Scope to authenticated, ideally same-school.
2. `school-update-images` storage: any authenticated user can upload/update/delete (081).
3. Re-audit live policies vs repo: migration `20260702072116` references policies that exist
   in no repo file — drift already proven.

Storage buckets referenced: `badges`, `assets`, `school-update-images`, `challenge-media`,
`promotional-assets`. Bucket policy verification = blocked on access.

Edge Functions: none exist; server logic = TanStack server functions (all now authed except
intentionally-public `listSchools`/`listHousesBySchool`/`checkDomainAvailable`).

## E. Cross-cutting debt

- Rotate the committed Resend API key (in git history) — **still outstanding**.
- Canonical green: tokens/emails say `#0A4B39`, components hardcode `#0B4B39` ×302 — needs a
  decision, then normalize to tokens.
- `/public/badges` ≈ 46 MB of 2 MB PNGs — optimize; filenames contain spaces.
- 27 `<img>` missing `alt`; mobile tap targets 28–36px (< 44px guideline).
- Hydration warning on `/` — re-check on live deploy (likely sandbox artifact).

## F. Suggested build order (pending sign-off)

1. Unblock verification (network policy, MCP auth, test accounts) → verify everything 🟡.
2. Schema reconciliation migrations + `users` RLS fix.
3. Fix 🔴 items (rollback flow, admin dashboard wiring, assembly present route,
   `/admin/updates`, houses/allowlist decision, AI badge server fn).
4. Build ⬜ gaps surfaced by verification.
5. Full end-to-end click-through per role; final report.
