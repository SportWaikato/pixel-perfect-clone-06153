# Test Accounts & Role-Gate Findings (Phase 0)

Written 2026-07-04. Claude has **no Supabase access** (network + MCP OAuth both
blocked), so account creation is yours. Everything is traced from code below;
the SQL is ready to paste.

## Role-gate trace — confirmed, `role` is the only gate

| Where | Gate |
| --- | --- |
| `src/routes/_authenticated/route.tsx` | must be authenticated; redirects to `/onboarding` if profile has no `school_id` **unless** `role = super_admin` |
| `src/routes/_authenticated/_admin.tsx` | `role IN ('school_admin','super_admin')` else → `/dashboard` |
| `src/routes/_authenticated/_superadmin.tsx` | `role = 'super_admin'` else → `/dashboard` |

- **A `super_admin` reaches every route** in both the `_admin` group (`/school*`)
  and the `_superadmin` group (`/admin*`) — the `_admin` guard explicitly
  includes `super_admin`. Confirmed by reading both guards.
- **No allowlist gates admin access.** `admin.allowlist.tsx` /
  `AllowedEmailsContent` manage the per-school `allowed_emails`/`blocked_emails`
  tables that control which **students** may register. Super admins do **not**
  need an allowlist entry.
- **No `is_active`/`is_deleted` gate** on route access — those only affect
  aggregates/leaderboards.

### ⚠️ Flags for Ashleigh (decide, don't want me to silently "fix")
1. **`canAccessAdmin()` in `roleUtils.ts` is dead code** — it's defined
   (`= isSuperAdmin`) but imported nowhere. The real guards use inline
   `profile.role !== '…'` string checks, not the `roleUtils` helpers. Not
   wrong, just not DRY. Options: (a) leave it, (b) route the guards through
   the helpers so there's one source of truth. I'd lean (b) but it touches
   auth so I'm not doing it unasked.
2. **`supabase/setup_living_lab.sql` is broken** — it does
   `... FROM users WHERE email ILIKE '%living-lab%'`, but the `users` table has
   **no `email` column** (email lives only in `auth.users`; that's why the
   `get_user_emails_by_ids` RPC exists). The corrected queries are below.

## Creating the three accounts

`role` is an enum-ish text column. The `users` table's NOT NULL columns are
`username`, `first_name`, `last_name` — so every insert must include them.

### Step 1 — ensure the "Sport Waikato" school exists

```sql
-- Karawhiua is school-scoped; SW is the internal test school (migration 033
-- marks code 'SW' / name 'Sport Waikato' as is_internal so it's hidden from
-- public leaderboards). Create it if missing.
INSERT INTO schools (name, code, is_active, is_internal, status)
VALUES ('Sport Waikato', 'SW', true, true, 'approved')
ON CONFLICT (code) DO UPDATE SET is_active = true, is_internal = true
RETURNING id;   -- note this id → <SW_SCHOOL_ID>

-- Give it at least two houses (students pick one; needed for leaderboards).
INSERT INTO houses (name, color, school_id)
SELECT h.name, h.color, s.id
FROM schools s
CROSS JOIN (VALUES ('Kōwhai','#E019C3'), ('Rātā','#1B5E4B')) AS h(name, color)
WHERE s.code = 'SW'
ON CONFLICT DO NOTHING;
```

### Step 2 — create the auth users

Do this in the **Auth → Users** dashboard (auth.users can't be safely inserted
by hand — it needs the hashed-password/identity plumbing). For each, click
**Add user**, set the email, tick **Auto-confirm**, and set a password you
keep. Emails:

- `test-superadmin@sportwaikato.nz`
- `test-schooladmin@sportwaikato.nz`
- `living-lab@sportwaikato.nz`

### Step 3 — create/patch the `users` profile rows

```sql
-- Grab the auth ids and the SW school + a house.
WITH ids AS (
  SELECT
    (SELECT id FROM auth.users WHERE email = 'test-superadmin@sportwaikato.nz') AS super_id,
    (SELECT id FROM auth.users WHERE email = 'test-schooladmin@sportwaikato.nz') AS schooladmin_id,
    (SELECT id FROM auth.users WHERE email = 'living-lab@sportwaikato.nz')       AS student_id,
    (SELECT id FROM schools WHERE code = 'SW') AS sw_school,
    (SELECT id FROM houses WHERE school_id = (SELECT id FROM schools WHERE code = 'SW')
       ORDER BY name LIMIT 1) AS sw_house
)
-- super_admin: school_id NULL so it never hits the onboarding redirect
INSERT INTO users (id, username, first_name, last_name, role, school_id, is_active)
SELECT super_id, 'test-superadmin', 'Test', 'SuperAdmin', 'super_admin', NULL, true FROM ids
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', school_id = NULL, is_active = true;

INSERT INTO users (id, username, first_name, last_name, role, school_id, is_active)
SELECT schooladmin_id, 'test-schooladmin', 'Test', 'SchoolAdmin', 'school_admin',
       sw_school, true FROM ids
ON CONFLICT (id) DO UPDATE SET role = 'school_admin',
       school_id = (SELECT sw_school FROM ids), is_active = true;

INSERT INTO users (id, username, first_name, last_name, role, school_id, house_id,
                   year_group, is_active, is_public)
SELECT student_id, 'living-lab', 'Living', 'Lab', 'student', sw_school, sw_house,
       'Year 10', true, true FROM ids
ON CONFLICT (id) DO UPDATE SET role = 'student',
       school_id = (SELECT sw_school FROM ids),
       house_id  = (SELECT sw_house FROM ids), is_active = true;
```

### Step 4 — verify (this is the corrected `setup_living_lab.sql`)

```sql
SELECT u.username, u.role, u.school_id, u.house_id, au.email
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE au.email IN (
  'test-superadmin@sportwaikato.nz',
  'test-schooladmin@sportwaikato.nz',
  'living-lab@sportwaikato.nz'
);
```

Expect: super_admin/`school_id NULL`, school_admin/SW, student/SW + a house.

### Note on the new guard trigger
If `20260704090000_guard_role_on_self_insert` has been applied, it does **not**
block the inserts above — it early-exits when `auth.uid()` is NULL (i.e. any
SQL-editor / service-role insert). It only guards client self-inserts.

## After accounts exist
Tell Claude the three passwords via a secret/env channel (not chat/git). Then
the full per-role click-through can finally run. Until then, all role-gated
verification stays 🟡.
