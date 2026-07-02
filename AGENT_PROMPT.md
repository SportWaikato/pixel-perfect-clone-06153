You are a VS Code agent working on the Karawhiua Virtual Sports Day application. Your task is to rebuild pages and features from the original Next.js repo into this TanStack Start clone, following the build plan at BUILD_PLAN.md.

## Project Context

This is a school physical activity competition platform for Sport Waikato (New Zealand). Students log activities, earn points for their houses, compete on leaderboards, earn badges/achievements, and participate in challenges/events. Three user roles: student, school_admin, super_admin.

- **Working directory:** `C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\pixel-perfect-clone-06153`
- **Tech stack:** TanStack Start (React 19 + SSR via Nitro/Cloudflare), Vite 8, Tailwind CSS v4, shadcn/ui, Formik + Yup, TanStack React Query, Supabase (PostgreSQL + Auth + RLS), Recharts, Framer Motion, Lucide React
- **Database:** Supabase project `zxxhjkruhwjondrbftaf` -- all 83 migrations already applied, do NOT create new migrations
- **Source of truth for original code:** `C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day` -- working tree is deleted, but full git history is available at HEAD. Read original files via: `git -C "<path>" show HEAD:<filepath>`
- **Build plan reference:** Read BUILD_PLAN.md at repo root for full page-by-page specification, component checklist, and migration patterns

## Critical Conventions

Before writing ANY code, study 3-4 existing route files and module components to match patterns exactly:

1. **Route pattern:** Every route uses `createFileRoute()` with `beforeLoad` for auth checks and data fetching. Component receives data via `Route.useRouteContext()`. See existing routes like `src/routes/_authenticated/dashboard.tsx` and `src/routes/_authenticated/events.tsx` for the exact pattern.
2. **Module components:** "use client" components in `src/modules/<feature>/components/`. They receive initial data as props and may use React Query for mutations. See `src/modules/events/components/EventsContent.tsx` for the pattern.
3. **Imports:** Use `@/` path alias (maps to `src/`). Always import from the exact file path -- never use barrel exports unless they exist.
4. **Supabase:** Browser client from `src/integrations/supabase/client.ts`, server client from `src/integrations/supabase/client.server.ts`. Service classes are in `src/models/<domain>/services/`.
5. **Forms:** Formik with Yup validation. Use `src/modules/common/components/Formik/` wrappers for formik-aware inputs.
6. **UI components:** shadcn/ui primitives from `src/components/ui/`, app-specific DesignSystem wrappers from `src/modules/application/components/DesignSystem/ui/`.
7. **Navigation:** `@tanstack/react-router` Link and useNavigate. NEVER import from next/navigation or next/link.
8. **Images:** Use plain `<img>` tags, NOT next/image. Images are in `public/`.
9. **Server functions:** Use `createServerFn` from `@tanstack/react-start`. See existing server functions for patterns.
10. **Brand colors:** Primary green `#0B4B39`, supporting green `#0F8061`, accent magenta `#D103D1`, pink `#DB4FDB`, background `#F0EFEB`, destructive `#EF4250`.

## What NOT To Do

- Do NOT create new database migrations -- the schema already exists
- Do NOT use next/navigation, next/link, or next/image
- Do NOT create Supabase client instances directly -- use existing services in src/models/
- Do NOT change existing model service files unless explicitly fixing a bug listed below
- Do NOT change existing working routes
- Do NOT add comments to code
- Do NOT run the dev server or try to preview the app

## PHASE-BY-PHASE EXECUTION

Execute in order. After each phase, run: `npx tsc --noEmit` and fix any TypeScript errors before continuing.

---

### Phase 1: Wire the Student Dashboard

**Route to modify:** `src/routes/_authenticated/dashboard.tsx` -- currently a stub showing "Kia ora {name}" and "Coming soon"

**Reference original:** Read the original dashboard page and component:

```
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:app/dashboard/page.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/dashboard/components/DashboardContent.tsx
```

**Components to build/port:**

1. **`StudentProgressionCard.tsx`** → `src/modules/dashboard/components/StudentProgressionCard.tsx`
   - Read original: `git -C "<original-repo>" show HEAD:modules/dashboard/components/StudentProgressionCard.tsx`
   - Adapt: replace `next/link` with `@tanstack/react-router` Link, replace `next/image` with `<img>`, change imports to use existing model services in the clone

2. **`DashboardContent.tsx`** → `src/modules/dashboard/components/DashboardContent.tsx`
   - Read original, adapt all imports
   - Uses: `StudentProgressionCard`, `SurveyPromptCard` (create placeholder if surveys module not yet ported), `formatTimeDisplay`, `TIME_GOALS`, achievement grid, streak card, recent activities list
   - Server actions `recalculateUserTotals`, `checkHistoricalAchievements`, `recalculateUserStreaks` already exist in the clone at `src/modules/activities/actions/` and `src/modules/achievements/actions/`
   - The `SurveyPromptCard` import can be wrapped in a conditional -- if surveys components don't exist yet, skip it

3. **Update `src/routes/_authenticated/dashboard.tsx`:**
   - Use `beforeLoad` to fetch: user achievements, all achievements, user points breakdown, current month progress, recent 3 activities, pending survey (can be null for now)
   - User profile is already available from the `_authenticated` layout context
   - Render `<DashboardContent>` with all fetched data
   - Match the exact pattern of other routes (see `src/routes/_authenticated/events.tsx`)

**Verify:** `npx tsc --noEmit` passes with no errors

---

### Phase 2: Build the Achievements Page

**Route to modify:** `src/routes/_authenticated/achievements.tsx` -- currently a stub

**Component to create:** `src/modules/achievements/components/AchievementsGrid.tsx`

- Full-page grid of badge cards
- Earned badges: full color with earned-date badge
- Unearned badges: greyed out with lock overlay
- Filter tabs: All / Earned / Not Yet Earned
- Each card: badge image (128x128), name, description on hover
- Uses `AchievementService.getAllAchievements()` and `AchievementService.getUserAchievements(userId)`
- Uses `BadgeImageHelper` from `src/models/achievements/helpers/BadgeImageHelper.ts`
- Reference the achievement grid section of `DashboardContent.tsx` for the card rendering pattern

**Update the route** to fetch data in `beforeLoad` and render `AchievementsGrid`

**Verify:** `npx tsc --noEmit` passes

---

### Phase 3: Build the Surveys System

**Important:** The original repo has a complete surveys module. Read ALL of these files first:

```
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/SurveyPageContent.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/SurveyModal.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/SurveyQuestion.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/SurveyDismissButton.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/SurveyPromptCard.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/components/AdminSurveysContent.tsx
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:modules/surveys/actions/surveyActions.ts
```

Also read the survey model:

```
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:models/surveys/services/SurveyService.ts
git -C "C:\Users\AshleighCarlson\OneDrive - Sport Waikato\Documents\GitHub\Karawhiua-Virtual-Sports-Day" show HEAD:models/surveys/interfaces/SurveyInterface.ts
```

**Check what exists in clone:** Look for `src/models/surveys/` directory. If it exists, check if SurveyService.ts is there. If not, port it.

**Port all survey components to the clone:**

- `src/modules/surveys/components/SurveyPageContent.tsx`
- `src/modules/surveys/components/SurveyModal.tsx`
- `src/modules/surveys/components/SurveyQuestion.tsx`
- `src/modules/surveys/components/SurveyDismissButton.tsx`
- `src/modules/surveys/components/SurveyPromptCard.tsx`
- `src/modules/surveys/components/AdminSurveysContent.tsx`
- `src/modules/surveys/actions/surveyActions.ts`

**Adapt each component:**

- Replace `next/navigation` imports with `@tanstack/react-router`
- Replace `next/link` with TanStack Link
- `router.refresh()` → `queryClient.invalidateQueries()`
- JSON action calls → `createServerFn` calls (check existing action patterns in the clone)
- Keep all Formik + Yup patterns as-is (same library)

**Create routes:**

1. `src/routes/_authenticated/survey.tsx` -- student survey page
   - beforeLoad: get pending survey, redirect to dashboard if none
   - Read original: `git -C "<original-repo>" show HEAD:app/survey/page.tsx`

2. `src/routes/_authenticated/_superadmin/admin.surveys.tsx` -- admin survey results
   - beforeLoad: check super_admin role, fetch all surveys + results
   - Read original: `git -C "<original-repo>" show HEAD:app/admin/surveys/page.tsx`

3. Update `src/routes/_authenticated/dashboard.tsx` to fetch pending survey and pass to DashboardContent so the SurveyPromptCard shows up

**Verify:** `npx tsc --noEmit` passes

---

### Phase 4: Complete School Admin Pages

**4A. School Messages** → `src/routes/_authenticated/_admin/school.messages.tsx`

- Currently a stub ("Wiring in next pass")
- Check if `SchoolMessagesContent` exists in `src/modules/admin/components/`. If not, create it.
- Read original messages handling from the school admin dashboard
- Features: compose message form (Formik: textarea + target selector), sent messages list with read status, mark-as-read
- Uses `SchoolMessageService` from `src/models/schoolMessages/services/SchoolMessageService.ts`

**4B. School Events/Challenges** → `src/routes/_authenticated/_admin/school.events.tsx` (NEW)

- School admin CRUD for challenges
- Check what exists: `src/modules/admin/components/CreateEventDialog.tsx`, `EditEventDialog.tsx`, `EventIconPicker.tsx`, `EventImageUpload.tsx` -- wire these
- Also port `ChallengeMediaUpload.tsx` from original if video upload is needed
- List: published / unpublished / draft tabs, each card shows name, dates, points, icon, image
- Actions: create, edit, publish, unpublish, delete
- Student-suggested challenge approval section
- Read original: `git -C "<original-repo>" show HEAD:app/admin/challenges/page.tsx`

**4C. School Activity Log** → `src/routes/_authenticated/_admin/school.activity.tsx` (NEW)

- Wire existing `ActivityLogContent` component from `src/modules/admin/components/ActivityLogContent.tsx`
- Read original: `git -C "<original-repo>" show HEAD:app/admin/activity/page.tsx`

**4D. My Suggestions (Student Page)** → `src/routes/_authenticated/challenges.my-suggestions.tsx` (NEW)

- Port `MySuggestionsContent.tsx` from original to `src/modules/events/components/MySuggestionsContent.tsx`
- Shows student's own suggested challenges and their approval status
- Read original: `git -C "<original-repo>" show HEAD:modules/events/components/MySuggestionsContent.tsx`

**Verify:** `npx tsc --noEmit` passes

---

### Phase 5: Complete Super Admin Pages

Create ALL of these new routes. For each, read the original page first to understand data fetching and component usage:

**5A. Deleted Users** → `src/routes/_authenticated/_superadmin/admin.deleted-users.tsx`

- Wire existing `DeletedUsersContent` component from `src/modules/admin/components/DeletedUsersContent.tsx`
- Read original: `git -C "<original-repo>" show HEAD:app/admin/deleted-users/page.tsx`

**5B. Allowlist** → `src/routes/_authenticated/_superadmin/admin.allowlist.tsx`

- Wire existing `AllowedEmailsContent` component
- Read original: `git -C "<original-repo>" show HEAD:app/admin/allowlist/page.tsx`

**5C. Super Admin Invites** → `src/routes/_authenticated/_superadmin/admin.invites.tsx`

- Wire existing `SuperAdminInviteSection` component
- Read original: `git -C "<original-repo>" show HEAD:app/admin/invites/page.tsx`

**5D. Audit Log** → `src/routes/_authenticated/_superadmin/admin.audit-log.tsx`

- Check if `AuditLogService` exists in clone at `src/models/audit/services/AuditLogService.ts`
- If not, read original from git and port it
- Port `AuditLogContent` component from original
- Read original: `git -C "<original-repo>" show HEAD:app/admin/audit-log/page.tsx`

**5E. Reports** → `src/routes/_authenticated/_superadmin/admin.reports.tsx`

- Port `ReportsContent` component from original
- Read original: `git -C "<original-repo>" show HEAD:app/admin/reports/page.tsx`

**5F. Analytics** → `src/routes/_authenticated/_superadmin/admin.analytics.tsx`

- Placeholder page: title "Analytics" with "Analytics dashboard coming soon."
- Read original: `git -C "<original-repo>" show HEAD:app/admin/analytics/page.tsx`

**5G. Settings** → `src/routes/_authenticated/_superadmin/admin.settings.tsx`

- Wire existing `TermManagementContent` from `src/modules/admin/components/settings/TermManagementContent.tsx`
- Read original: `git -C "<original-repo>" show HEAD:app/admin/settings/page.tsx`

**Verify:** `npx tsc --noEmit` passes

---

### Phase 6: Port Missing Assembly Slides

Check the clone's `src/modules/admin/components/assembly/` directory for these files. If missing, port from original:

1. `HouseBadgeSlide.tsx`
2. `HouseStatisticsSlide.tsx`
3. `SchoolLeaderboardSlide.tsx`
4. `WinnersGallerySlide.tsx`

Read each from: `git -C "<original-repo>" show HEAD:modules/admin/components/assembly/<filename>.tsx`

Wire them into the slide rotation in `AssemblyPresentationContent.tsx` (check how existing slides like `ChallengeSlide` are wired).

**Verify:** `npx tsc --noEmit` passes

---

### Phase 7: Update Navigation

Read and update these navigation components to include all new routes:

- `src/modules/application/components/Navigation/MainNavigation.tsx` -- top navbar, add links for new super admin pages
- `src/modules/application/components/Navigation/MobileBottomNav.tsx` -- student bottom nav, ensure achievements and survey links exist
- `src/modules/application/components/Navigation/AdminMobileBottomNav.tsx` -- admin bottom nav, add kōrero link with notification badge, add new admin routes
- `src/modules/application/components/Navigation/ConditionalNavigation.tsx` -- check role-based nav switching logic

For each component:

1. Read the current file
2. Add missing route links using `<Link to="/path">` from `@tanstack/react-router`
3. Match the existing styling patterns exactly
4. Keep existing links that are already there

**Verify:** `npx tsc --noEmit` passes

---

### Phase 8: Apply Bug Fixes

Read the audit findings in BUILD_PLAN.md Phase 8. Focus on these critical fixes:

1. **Filter `is_deleted` users from aggregates:** Search all model services for queries that sum/aggregate `houses.total_points`, `schools.total_points`, or leaderboard data. Ensure `WHERE is_deleted = false` or `WHERE users.is_deleted = false` is in the query.

2. **Remove hard-coded leaderboard limits:** Search for `.limit(4)` or hardcoded limits in `LeaderboardService.ts` and `HouseService.ts`. Remove limits or increase to a reasonable number like 50.

3. **Check `getUserPointsBreakdown()`:** Read `src/models/users/services/UserService.ts` and find the `getUserPointsBreakdown` method. Ensure it correctly categorizes fixed-point challenge activities.

**Verify:** `npx tsc --noEmit` passes

---

### Phase 9: Final Verification

1. Run `npx tsc --noEmit` -- must pass with zero errors
2. Search for any remaining `next/navigation` or `next/link` imports in new files: `rg "next/navigation|next/link|next/image" src/routes/ src/modules/ --files-with-matches`
3. Search for any database client imports that bypass the service layer: `rg "from '@supabase/supabase-js'" src/routes/ src/modules/ --files-with-matches` (should only appear in model services)
4. List all new route files created: `Get-ChildItem -Recurse src/routes -Name | Sort-Object`

## Key Reference Patterns

### TanStack Start Route with beforeLoad:

```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/example')({
  beforeLoad: async ({ context }) => {
    const { profile } = context;
    // fetch data using existing services
    return { someData };
  },
  component: ExampleComponent,
});

function ExampleComponent() {
  const { someData } = Route.useRouteContext();
  // also access profile from parent layout context if needed
  return <SomeModuleComponent data={someData} />;
}
```

### Module Component Pattern:

```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
// ... specific service imports

interface ExampleContentProps {
  user: UserInterface;
  initialData: SomeType[];
}

const ExampleContent = ({ user, initialData }: ExampleContentProps) => {
  const queryClient = useQueryClient();
  // Use initialData as placeholderData for instant SSR render
  const { data } = useQuery({
    queryKey: ["example", user.id],
    queryFn: () => service.getData(user.id),
    placeholderData: initialData,
  });
  // ... component JSX
};
```

### Link from TanStack Router:

```typescript
import { Link } from '@tanstack/react-router';
<Link to="/dashboard" className="...">Dashboard</Link>
```

### Redirect:

```typescript
import { redirect } from "@tanstack/react-router";
throw redirect({ to: "/dashboard" });
```

## Gotchas

- Route files use FLAT naming: `_authenticated/_superadmin/admin.deleted-users.tsx` -- the dots create nested URL segments. So `admin.deleted-users` = URL `/admin/deleted-users`
- The `_authenticated` layout already provides `authUser` and `profile` in context. Use `Route.useRouteContext()` or access through parent context.
- When porting from original, `router.refresh()` needs to become `queryClient.invalidateQueries({ queryKey: [...] })` -- you need to define queryKeys.
- Original server actions that look like `'use server' async function` may need to be converted to `createServerFn()` if they're called from client components. Check how existing actions in the clone handle this (some may use a different pattern).

## Starting Point

Begin by reading BUILD_PLAN.md and the existing route files to understand the patterns, then execute Phase 1. Do not skip phases. Submit progress after each phase completes with no TypeScript errors.
