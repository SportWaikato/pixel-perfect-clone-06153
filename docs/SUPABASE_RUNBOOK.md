# Supabase Runbook — actions only a project owner can do

Claude has no access to Supabase project `zxxhjkruhwjondrbftaf` (sandbox network
policy + MCP OAuth both blocked), so these steps are yours. Work top to bottom.
Written 2026-07-03.

## 1. Apply the two new security migrations (5 min, do first)

In the [Supabase SQL editor](https://supabase.com/dashboard/project/zxxhjkruhwjondrbftaf/sql),
paste and run, in order:

1. `supabase/migrations/20260703130000_scope_users_select_same_school.sql`
   — stops any signed-in student enumerating every child on the platform.
2. `supabase/migrations/20260703130500_tighten_school_updates_storage.sql`
   — stops students uploading/deleting school-update images.
3. `supabase/migrations/20260704090000_guard_role_on_self_insert.sql`
   — blocks privilege escalation: profile creation is client-side, and the
   existing trigger only guards UPDATEs, so any auth user without a profile
   could INSERT themselves role='super_admin' (or school_admin of any school).
   After applying, re-test all three registration flows: student onboarding,
   /register-school, and /invite/<token> — the trigger allows each legit path.

Then sanity-check as a **student** account (SQL editor → run as... or just use
the app): the leaderboard and dashboard should still load (they use
`get_user_rankings`, a SECURITY DEFINER RPC, so cross-school reads survive).
If any screen goes blank after this, tell Claude which one — it means a query
reads `users` cross-school directly and needs moving into an RPC.

## 2. Schema reconciliation — capture what only exists live (15 min)

The frontend uses these, but no repo migration creates them:
tables `surveys`, `survey_questions`, `survey_responses`, `user_survey_status`,
`audit_log`, `badges`, `house_achievements`; functions `get_school_join_code`,
`lookup_school_by_join_code`, `get_term_points`, `reset_term_points`,
`increment_feed_like`, `get_audit_log`, `get_unique_user_report`.

On your machine (repo checked out, [Supabase CLI](https://supabase.com/docs/guides/local-development) installed):

```bash
npx supabase login                      # opens browser
npx supabase link --project-ref zxxhjkruhwjondrbftaf
npx supabase db pull                    # writes a migration capturing live schema
git add supabase/migrations && git commit -m "chore: capture live schema (drift reconciliation)"
git push
```

`db pull` diffs live schema against repo migrations and writes the difference
as a new migration file — that file IS the reconciliation. Push it and Claude
takes it from there (review + checklist update).

## 3. Rotate the exposed Resend key (10 min) — STILL OUTSTANDING

The old key (`re_ZXpYmwQn_…`) is in git history permanently.

1. [Resend dashboard](https://resend.com/api-keys) → create new key → delete the old one.
2. Put the new key in your local `.env` (`RESEND_API_KEY=...`) — never commit it.
3. Set it in the deploy environment (Lovable: project → Settings → Environment
   variables → `RESEND_API_KEY`). Server functions read `process.env`, so the
   deploy env is what production actually uses.

## 4. Server-side env vars for the deploy environment

Confirm these exist in Lovable's env settings (all server-only, no `VITE_` prefix):

| Var | Purpose |
| --- | --- |
| `RESEND_API_KEY` | transactional email (new key from step 3) |
| `SW_SERVICE_ROLE_KEY` | admin server functions (bypasses RLS) |
| `GOOGLE_AI_API_KEY` | AI badge generation (new — replaces `VITE_GOOGLE_AI_API_KEY`) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | server-side Supabase clients |

If `VITE_GOOGLE_AI_API_KEY` is set anywhere, **delete it and rotate that
Google key** — anything `VITE_`-prefixed was bundled into public JS.

## 5. Test accounts for verification (10 min)

Create three accounts so flows can be click-verified per role:

1. In the app: sign up a **student** on a test school (or use `/join/<code>`).
2. [Auth dashboard](https://supabase.com/dashboard/project/zxxhjkruhwjondrbftaf/auth/users):
   create `test-schooladmin@…` and `test-superadmin@…` (Auto-confirm ON).
3. SQL editor — link profiles and roles (adjust school):

```sql
-- pick a school to attach the admins to
SELECT id, name FROM schools LIMIT 5;

INSERT INTO users (id, username, first_name, last_name, role, school_id, is_active)
VALUES
  ('<auth-uid-of-schooladmin>', 'test-schooladmin', 'Test', 'SchoolAdmin', 'school_admin', '<school-id>', true),
  ('<auth-uid-of-superadmin>',  'test-superadmin',  'Test', 'SuperAdmin',  'super_admin',  NULL, true);
```

Then share the three logins with Claude via env/secrets (not in chat, not in git).

## 6. Unblock Claude's verification loop

- **Network policy**: Claude Code environment settings → network policy →
  allow `zxxhjkruhwjondrbftaf.supabase.co` (and ideally
  `pixel-perfect-clone-06153.lovable.app` for live-deploy checks).
- **Supabase MCP**: open this repo in an interactive Claude Code session
  (CLI/desktop) → run `/mcp` → authenticate `supabase`. One-time OAuth.

## 7. Notes

- **No Edge Functions are needed** — server logic runs as TanStack server
  functions inside the app deploy. Nothing to create in the Functions tab.
- Badge PNG optimization happens in-repo (no bucket action needed); the
  `badges` storage bucket and its DB `image_filename` values stay as-is.
- After steps 1–2, ask Claude to re-run the security review against the live
  schema (advisors + policy audit) — that's when 🟡 items can start moving to ✅.
