# Karawhiua Virtual Sports Day -- Build Plan

## Overview

This document is the complete build plan for migrating **Karawhiua Virtual Sports Day** from Next.js 15 to TanStack Start / Vite, incorporating the Trello project hub recommendations, the behavioural survey redesign, and all resources from the planning folder.

**Source repo:** `Karawhiua-Virtual-Sports-Day` (Next.js 15, 227 commits, 516 files -- working tree **deleted**)  
**Target repo:** `pixel-perfect-clone-06153` (TanStack Start, ~40 commits, actively maintained)  
**Database:** Supabase project `zxxhjkruhwjondrbftaf` (all 83 migrations already applied)  
**Target host:** Cloudflare Workers via Nitro

---

## Current Clone Status Summary

### ALREADY BUILT (fully wired routes + modules)

| Route                    | Page                                     | Module Components                                                                |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `/auth`                  | Sign In / Sign Up                        | LoginForm, SignUpForm, Google OAuth                                              |
| `/auth/callback`         | OAuth callback                           | Built inline                                                                     |
| `/forgot-password`       | Password reset request                   | ForgotPasswordForm                                                               |
| `/reset-password`        | Set new password                         | ResetPasswordForm                                                                |
| `/register-school`       | School self-registration (4-step wizard) | Built inline (new feature)                                                       |
| `/onboarding`            | Student onboarding (4-step wizard)       | Built inline (new feature)                                                       |
| `/join/$code`            | Join by invite code                      | Built inline                                                                     |
| `/events`                | Events listing                           | EventsContent                                                                    |
| `/events/$id`            | Individual event detail                  | IndividualEventContent                                                           |
| `/activities`            | Activity logging                         | ActivitiesContent, LogActivityWizard (6 steps), LogActivityForm, ActivityHistory |
| `/leaderboard`           | Leaderboard                              | LeaderboardContent                                                               |
| `/profile`               | User profile                             | ProfileContent                                                                   |
| `/korero`                | Kōrero voting                            | KoreroVotingForm / KooreroVotingForm                                             |
| `/school`                | School admin dashboard                   | SchoolAdminDashboard                                                             |
| `/school/users`          | User management                          | UserManagementContent                                                            |
| `/school/updates`        | School updates                           | SchoolUpdatesContent                                                             |
| `/school/assembly`       | Assembly management                      | AssemblyManagementContent, AssemblyPresentationContent, slides                   |
| `/school/leaderboard`    | Admin leaderboard view                   | LeaderboardContent                                                               |
| `/admin`                 | Super admin dashboard                    | AdminDashboardContent                                                            |
| `/admin/schools`         | School management                        | SchoolManagementContent, SchoolCreateEditDialog                                  |
| `/admin/schools/pending` | Pending school approvals                 | Built inline with approveSchool/rejectSchool server functions                    |
| `/admin/users`           | User management (global)                 | UserManagementContent                                                            |
| `/admin/events`          | Event/challenge approval                 | EventApprovalContent                                                             |
| `/admin/houses`          | House management                         | HouseManagementContent                                                           |
| `/admin/badges`          | Badge/achievement management             | BadgeManagementContent, BadgeCreateEditDialog, BadgeCriteriaBuilder              |
| `/admin/media`           | Media/assets management                  | AssetManagementContent, AssetCreateEditDialog                                    |
| `/admin/assembly`        | Assembly management (global)             | AssemblyManagementContent                                                        |

### ALL MODEL SERVICES (already ported)

All services in `src/models/` are fully implemented:

- ActivityService, AchievementService, AssemblyService, AssetService, AuthService
- AllowedEmailService, BlockedEmailService, EventService, HouseService
- InviteService, KoreroVoteService, LeaderboardService
- SchoolMessageService, SchoolService, SchoolUpdateService, SchoolTermService
- StorageService, UserService, SurveyService (exists but needs review against new brief)

### STUBS / PLACEHOLDERS (need full implementation)

| Route              | Current State                                                                        |
| ------------------ | ------------------------------------------------------------------------------------ |
| `/dashboard`       | Shows "Kia ora {name}" + profile card + "Coming soon" -- needs full DashboardContent |
| `/achievements`    | Static text "Achievements grid will be wired in the next pass"                       |
| `/school/messages` | Static text "Wiring in next pass"                                                    |

### NOT YET CREATED (no route exists)

| Route                        | Original Next.js Page                    | Priority             |
| ---------------------------- | ---------------------------------------- | -------------------- |
| `/survey`                    | `app/survey/page.tsx`                    | HIGH - survey system |
| `/challenges/my-suggestions` | `app/challenges/my-suggestions/page.tsx` | MEDIUM               |
| `/admin/activity`            | `app/admin/activity/page.tsx`            | MEDIUM               |
| `/admin/allowlist`           | `app/admin/allowlist/page.tsx`           | MEDIUM               |
| `/admin/audit-log`           | `app/admin/audit-log/page.tsx`           | LOW                  |
| `/admin/reports`             | `app/admin/reports/page.tsx`             | MEDIUM               |
| `/admin/settings`            | `app/admin/settings/page.tsx`            | LOW                  |
| `/admin/surveys`             | `app/admin/surveys/page.tsx`             | HIGH - survey system |
| `/admin/analytics`           | `app/admin/analytics/page.tsx`           | LOW                  |
| `/admin/deleted-users`       | `app/admin/deleted-users/page.tsx`       | MEDIUM               |
| `/admin/invites`             | `app/admin/invites/page.tsx`             | LOW                  |

### MODULE COMPONENTS NOT YET PORTED FROM ORIGINAL

| Component                    | Original Path                        | Status                  |
| ---------------------------- | ------------------------------------ | ----------------------- |
| `AuditLogContent.tsx`        | `modules/admin/components/`          | MISSING in clone        |
| `ReportsContent.tsx`         | `modules/admin/components/`          | MISSING in clone        |
| `ChallengeMediaUpload.tsx`   | `modules/admin/components/`          | MISSING in clone        |
| `EventImageUpload.tsx`       | `modules/admin/components/`          | EXISTS in clone         |
| `TermManagementContent.tsx`  | `modules/admin/components/settings/` | EXISTS in clone (moved) |
| `StudentProgressionCard.tsx` | `modules/dashboard/components/`      | MISSING in clone        |
| `MySuggestionsContent.tsx`   | `modules/events/components/`         | MISSING in clone        |
| **All survey components**    | `modules/surveys/`                   | ENTIRELY MISSING        |
| `HouseBadgeSlide.tsx`        | `modules/admin/components/assembly/` | MISSING in clone        |
| `HouseStatisticsSlide.tsx`   | `modules/admin/components/assembly/` | MISSING in clone        |
| `SchoolLeaderboardSlide.tsx` | `modules/admin/components/assembly/` | MISSING in clone        |
| `WinnersGallerySlide.tsx`    | `modules/admin/components/assembly/` | MISSING in clone        |

---

## Build Phases

---

# PHASE 1 -- STUDENT DASHBOARD (wire the full dashboard)

**Priority:** HIGH | **Estimated Effort:** 2-3 days  
**Goal:** Replace the stub `/dashboard` with the full dashboard experience including achievements grid, streak card, monthly progress bar, recent activities, survey prompt, and student progression.

## 1.1 -- Dashboard Page

**Route:** `src/routes/_authenticated/dashboard.tsx` (REPLACE existing stub)  
**Original reference:** `app/dashboard/page.tsx`

### Data to fetch (via `beforeLoad` or component loader):

```
user profile (from context, already provided by _authenticated layout)
user achievements via AchievementService.getUserAchievements(userId)
all achievements via AchievementService.getAllAchievements()
user points breakdown via UserService.getUserPointsBreakdown(userId)
current month progress via UserService.getCurrentMonthProgress(userId)
recent 3 activities via ActivityService.getByUserId(userId, 3)
pending survey via SurveyService.shouldShowSurvey(userId)
```

### Migration notes (Next.js → TanStack Start):

| Next.js Pattern                                       | TanStack Start Pattern                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `async function Page()` server component              | `beforeLoad()` with `context` for data fetching, or React Query in component                                |
| `UserService(supabase)` with `createSupabaseServer()` | Use Supabase client from `src/integrations/supabase/client.server.ts` or `createServerClient()` via context |
| `redirect()` from server                              | `throw redirect()` in `beforeLoad`                                                                          |
| `router.refresh()` after mutation                     | `queryClient.invalidateQueries()`                                                                           |
| `next/link`                                           | `@tanstack/react-router` `Link`                                                                             |
| `next/image`                                          | Standard `<img>` or Vite image handling                                                                     |

### Components to port/create:

1. **`DashboardContent`** (`src/modules/dashboard/components/DashboardContent.tsx`) -- PORT from original
   - Props: `user`, `initialUserAchievements`, `allAchievements`, `initialTotalPoints`, `initialCurrentMonthMinutes`, `recentActivities`, `pendingSurvey`
   - Contains: greeting header, "Log Activity" FAB button, survey prompt card, StudentProgressionCard, monthly progress bar, achievements grid with badges, streak card with fire icon, recent activities list
   - Uses: `formatTimeDisplay`, `TIME_GOALS`, `getActivityIcon`, `getActivityColor`, `getFeelingEmoji`, `BadgeImageHelper`
   - Actions: `recalculateUserTotals`, `checkHistoricalAchievements`, `recalculateUserStreaks`

2. **`StudentProgressionCard`** (`src/modules/dashboard/components/StudentProgressionCard.tsx`) -- CREATE (port from original)
   - Props: `userId`, `schoolId`, `lifetimePoints`, `variant` ("compact" | "full")
   - Displays: school rank, house rank, year group rank, overall rank
   - Uses: `LeaderboardService.getUserRankings()` or user ranking fields

3. **`SurveyPromptCard`** (`src/modules/surveys/components/SurveyPromptCard.tsx`) -- CREATE (port from original)
   - Props: `surveyType`, `surveyName`
   - Displays: survey type icon, name, description, "Take Survey" link
   - Maps survey types to descriptions

### Tasks:

- [ ] 1.1.1 Create `StudentProgressionCard.tsx` in `src/modules/dashboard/components/`
- [ ] 1.1.2 Create `SurveyPromptCard.tsx` in `src/modules/surveys/components/`
- [ ] 1.1.3 Port `DashboardContent.tsx` from original to clone (adapt imports: `next/image` → `<img>`, `next/link` → TanStack `Link`, `next/navigation` → `useNavigate`)
- [ ] 1.1.4 Update `src/routes/_authenticated/dashboard.tsx` to fetch all data and render `DashboardContent`
- [ ] 1.1.5 Verify `formatTimeDisplay` and `TIME_GOALS` constants exist in `src/models/application/constants/`
- [ ] 1.1.6 Verify `recalculateUserTotals`, `checkHistoricalAchievements`, `recalculateUserStreaks` server actions exist in clone
- [ ] 1.1.7 Test: dashboard loads with greeting, achievements grid, streak card, monthly progress, recent activities

---

# PHASE 2 -- STUDENT ACHIEVEMENTS PAGE

**Priority:** MEDIUM | **Estimated Effort:** 1-2 days  
**Goal:** Build the standalone achievements/badges gallery page.

## 2.1 -- Achievements Page

**Route:** `src/routes/_authenticated/achievements.tsx` (REPLACE existing stub)  
**Original reference:** (no dedicated page in original -- achievements were in dashboard)

### Page design:

- Large grid of all badges (earned in color, unearned greyed out)
- Filter by: All / Earned / Not Yet Earned
- Each badge shows: image, name, description, earned date (if earned)
- Achievement category tabs (Participation, Consistency, Milestones, Challenge)
- Progress indicators for partially-earned achievements

### Components to create:

1. **`AchievementsGrid`** -- new component in `src/modules/achievements/components/`
   - Grid of badge cards with earned/unearned state
   - Tooltip with description + criteria on hover
   - Filter tabs at top
2. **`AchievementCard`** -- new component
   - Badge image with grayscale toggle for unearned
   - Name, description, earned date badge
3. **`AchievementProgress`** -- optional component for progressive achievements
   - e.g., "30/50 hours logged" progress bar

### Data fetching:

```
allAchievements via AchievementService.getAllAchievements()
userAchievements via AchievementService.getUserAchievements(userId)
```

### Tasks:

- [ ] 2.1.1 Create `AchievementsGrid.tsx` in `src/modules/achievements/components/`
- [ ] 2.1.2 Update `src/routes/_authenticated/achievements.tsx` to fetch data and render grid
- [ ] 2.1.3 Test: page shows all badges with earned/unearned states

---

# PHASE 3 -- STUDENT SURVEYS SYSTEM

**Priority:** HIGH | **Estimated Effort:** 3-5 days  
**Goal:** Implement the 4 behavioural surveys from the developer brief, port the existing survey infrastructure, and create the student survey page.

**Reference documents:**

- `Karawhiua_Behavioural_Survey_Redesign_Developer_Brief (1).docx`
- Original `modules/surveys/` code
- Original `app/survey/page.tsx`

## 3.1 -- Survey Database Models & Service

**Model:** `src/models/surveys/` (PORT from original with enhancements for new brief)

### Original tables (check if exist in Supabase):

- `surveys` -- survey definitions (id, name, description, survey_type)
- `survey_questions` -- questions per survey (id, survey_id, question_text, question_type, sort_order, options)
- `survey_responses` -- individual answers (id, user_id, question_id, answer)
- `user_survey_status` -- tracks completion/pending/dismissed per user per survey (id, user_id, survey_id, status, survey_type)

### Survey types (from brief):

```
early_engagement     → 3 weeks after signup (Survey 1)
behaviour_change     → 12 weeks / mid-term (Survey 2)
challenge_completion → After challenge completion (Survey 3)
end_of_year          → Date: Dec 11 (Survey 4)
```

### Question types:

```
single_select   → Radio buttons (one answer)
multi_select    → Checkboxes (multiple answers)
free_text       → Text input
rank_order      → Drag-to-order ranking
```

### Migrations needed (check if exist):

- Check `supabase/migrations/` for survey-related migrations
- If missing, create migration for survey tables

### Tasks:

- [ ] 3.1.1 Check Supabase for survey tables; create migration if missing
- [ ] 3.1.2 Create `src/models/surveys/interfaces/SurveyInterface.ts` with types for all 4 surveys
- [ ] 3.1.3 Create/port `src/models/surveys/services/SurveyService.ts` with methods:
  - `getAllSurveys()` -- all active surveys
  - `getSurveyById(id)` -- single survey with questions
  - `getSurveyByType(type)` -- get survey by trigger type
  - `shouldShowSurvey(userId)` -- check if user has pending survey
  - `checkAndTriggerSurveys(userId, createdAt)` -- trigger surveys based on rules:
    - Survey 1: 3 weeks after signup
    - Survey 2: 12 weeks after signup
    - Survey 3: after any challenge completion
    - Survey 4: on Dec 11
  - `submitSurveyResponses(surveyId, userId, responses)` -- save answers, mark completed
  - `dismissSurvey(surveyId, userId)` -- mark as dismissed
  - `getSurveyResults(surveyId, schoolId?)` -- aggregated results for admin
  - `seedDefaultSurveys()` -- insert the 4 surveys from the brief

## 3.2 -- Survey Student Page

**Route:** `src/routes/_authenticated/survey.tsx` (NEW)  
**Original reference:** `app/survey/page.tsx`

### Page structure:

- If no pending survey → "All caught up" card with checkmark
- If pending survey → full-screen survey modal/wizard

### Components to port/create:

1. **`SurveyPageContent`** (`src/modules/surveys/components/SurveyPageContent.tsx`) -- PORT
   - Checks for pending survey, renders either "all caught up" or the survey

2. **`SurveyModal`** (`src/modules/surveys/components/SurveyModal.tsx`) -- PORT
   - Multi-step Formik form
   - One question per step with progress bar
   - "Back" and "Next" navigation buttons
   - Dismiss button option
   - Submit button on last question

3. **`SurveyQuestion`** (`src/modules/surveys/components/SurveyQuestion.tsx`) -- PORT
   - Renders appropriate input type based on question_type:
     - `single_select` → Radio group
     - `multi_select` → Checkbox group
     - `free_text` → Textarea
     - `rank_order` → Drag-to-rank list
   - "Other" option with free-text field for select types

4. **`SurveyDismissButton`** (`src/modules/surveys/components/SurveyDismissButton.tsx`) -- PORT
   - Dismiss button with confirmation

5. **`submitSurveyResponses`** action (`src/modules/surveys/actions/surveyActions.ts`) -- PORT
   - Server action that saves responses and updates user_survey_status

### Tasks:

- [ ] 3.2.1 Create route `src/routes/_authenticated/survey.tsx`
- [ ] 3.2.2 Port `SurveyPageContent.tsx`
- [ ] 3.2.3 Port `SurveyModal.tsx`
- [ ] 3.2.4 Port `SurveyQuestion.tsx` (for all 4 question types)
- [ ] 3.2.5 Port `SurveyDismissButton.tsx`
- [ ] 3.2.6 Port survey actions
- [ ] 3.2.7 Test: full survey flow -- trigger → take → submit → status update

## 3.3 -- Survey Admin Page

**Route:** `src/routes/_authenticated/_superadmin/admin.surveys.tsx` (NEW)  
**Original reference:** `app/admin/surveys/page.tsx`

### Page structure:

- Tabs for each survey type
- Stats cards: total completed, pending, dismissed, response rate
- Per-question breakdown with bar charts for answer distribution
- Free-text response viewer
- "No responses yet" empty state

### Components to port:

1. **`AdminSurveysContent`** (`src/modules/surveys/components/AdminSurveysContent.tsx`) -- PORT
   - Props: `surveys`, `results`
   - Tabs per survey type
   - Stats overview cards
   - Question-by-question answer distribution bars

### Data fetching:

```
SurveyService.getAllSurveys()
SurveyService.getSurveyResults(surveyId, schoolId?) -- per survey
```

### Tasks:

- [ ] 3.3.1 Create route `src/routes/_authenticated/_superadmin/admin.surveys.tsx`
- [ ] 3.3.2 Port `AdminSurveysContent.tsx`
- [ ] 3.3.3 Test: admin views survey results with distribution charts

---

# PHASE 4 -- SCHOOL ADMIN PAGES

**Priority:** HIGH | **Estimated Effort:** 5-7 days  
**Goal:** Complete all school admin pages that are missing or stubbed.

## 4.1 -- School Messages (wire stub)

**Route:** `src/routes/_authenticated/_admin/school.messages.tsx` (REPLACE stub)  
**Original reference:** `app/admin/` (messages were managed within school admin area)

### Page structure:

- Message compose form (Formik: message text, target: all users or specific house)
- Sent messages list with read/unread status
- Mark all as read button

### Components needed:

- Port from original school admin dashboard (messages section was inline, not separate route)
- Create `SchoolMessagesContent` component if not in clone

### Data fetching:

```
SchoolMessageService.getBySchoolId(schoolId)
SchoolMessageService.countUnreadBySchoolId(schoolId)
```

### Tasks:

- [ ] 4.1.1 Implement message CRUD in route file or create `SchoolMessagesContent` component
- [ ] 4.1.2 Form: compose new message (textarea + target selector)
- [ ] 4.1.3 List: sent messages with read status, timestamps, author
- [ ] 4.1.4 Actions: send message, mark as read

## 4.2 -- Challenge/Event Management (separate admin page)

**Route:** `src/routes/_authenticated/_admin/school.events.tsx` (NEW)  
**Original reference:** `app/admin/challenges/page.tsx`

### Note: The clone currently uses `/admin/events` for super admin event approval.

School admins need their own event management page for creating/editing school-specific challenges.

### Page structure:

- "Create Challenge" button → dialog
- List of challenges: Published / Unpublished / Draft tabs
- Each challenge card: name, date range, points, icon, image, student suggestions badge
- Actions: Edit, Publish/Unpublish, Delete, View Submissions
- Student-suggested challenges approval section

### Components to port/create:

1. **`CreateEventDialog`** -- ALREADY EXISTS in clone (`src/modules/admin/components/CreateEventDialog.tsx`)
2. **`EditEventDialog`** -- ALREADY EXISTS in clone (`src/modules/admin/components/EditEventDialog.tsx`)
3. **`ChallengeMediaUpload`** (`src/modules/admin/components/ChallengeMediaUpload.tsx`) -- PORT from original
   - Image upload for challenge banner
   - MP4 video upload for challenge promo
4. **`EventIconPicker`** -- ALREADY EXISTS in clone (`src/modules/admin/components/EventIconPicker.tsx`)
5. **`EventImageUpload`** -- ALREADY EXISTS in clone (`src/modules/admin/components/EventImageUpload.tsx`)

### Tasks:

- [ ] 4.2.1 Create route `src/routes/_authenticated/_admin/school.events.tsx`
- [ ] 4.2.2 Create `ChallengeMediaUpload` component for video upload support
- [ ] 4.2.3 Wire CreateEventDialog and EditEventDialog
- [ ] 4.2.4 Add publish/unpublish toggle
- [ ] 4.2.5 Add student suggestions approval section
- [ ] 4.2.6 Test: create challenge → publish → appears on student events page

## 4.3 -- My Suggestions (student page)

**Route:** `src/routes/_authenticated/challenges.my-suggestions.tsx` (NEW)  
**Original reference:** `app/challenges/my-suggestions/page.tsx`

### Page structure:

- List of challenges the student has suggested
- Status for each: Pending Approval / Approved / Rejected
- Show challenge details, date submitted
- Link to create new suggestion

### Components to port:

1. **`MySuggestionsContent`** (`src/modules/events/components/MySuggestionsContent.tsx`) -- PORT from original
   - Props: `user`
   - Fetches user's pending events

### Tasks:

- [ ] 4.3.1 Create route `src/routes/_authenticated/challenges.my-suggestions.tsx`
- [ ] 4.3.2 Port `MySuggestionsContent.tsx`
- [ ] 4.3.3 Test: student sees their suggested challenges with status

## 4.4 -- School Admin Activity Log (separate page)

**Route:** `src/routes/_authenticated/_admin/school.activity.tsx` (NEW)  
**Original reference:** `app/admin/activity/page.tsx`

### Page structure:

- Table of all activities at the school
- Filters: user, house, date range, activity type
- Flagged activities highlight (potential gaming)
- Actions per row: Reject, Restore, Export
- Bulk actions: reject selected, export CSV

### Components:

1. **`ActivityLogContent`** -- ALREADY EXISTS in clone (`src/modules/admin/components/ActivityLogContent.tsx`)
2. **`ActivityRow`** -- ALREADY EXISTS in clone
3. **`ActivityLogPreview`** -- ALREADY EXISTS in clone
4. **`ActivityExportDialog`** -- ALREADY EXISTS in clone

### Tasks:

- [ ] 4.4.1 Create route `src/routes/_authenticated/_admin/school.activity.tsx`
- [ ] 4.4.2 Wire existing `ActivityLogContent` component
- [ ] 4.4.3 Test: school admin can view, filter, reject, and export activities

---

# PHASE 5 -- SUPER ADMIN PAGES

**Priority:** MEDIUM-HIGH | **Estimated Effort:** 5-7 days  
**Goal:** Complete all super admin pages missing from the clone.

## 5.1 -- Deleted Users Page

**Route:** `src/routes/_authenticated/_superadmin/admin.deleted-users.tsx` (NEW)  
**Original reference:** `app/admin/deleted-users/page.tsx`

### Page structure:

- Table of soft-deleted users from all schools
- Columns: name, email, school, house, year, deleted date, role
- Actions: Restore user, Permanently delete
- Filter by school

### Components:

1. **`DeletedUsersContent`** -- EXISTS in clone (`src/modules/admin/components/DeletedUsersContent.tsx`)
   - Props: `initialUsers`

### Data fetching:

```
UserService.getDeletedUsers(schoolId?)
UserService.restoreUser(id)
UserService.permanentlyDeleteUser(id) -- server action exists in clone
```

### Tasks:

- [ ] 5.1.1 Create route `src/routes/_authenticated/_superadmin/admin.deleted-users.tsx`
- [ ] 5.1.2 Wire `DeletedUsersContent` component
- [ ] 5.1.3 Test: view deleted users, restore one, verify it reappears in user list

## 5.2 -- Allowlist Page

**Route:** `src/routes/_authenticated/_superadmin/admin.allowlist.tsx` (NEW)  
**Original reference:** `app/admin/allowlist/page.tsx`

### Page structure:

- School picker (for super admins) or auto-select (for school admins)
- Current allowlist table: email, added date, added by, note
- Add emails form: bulk textarea (one email per line), note field
- Remove email button
- Stats: total allowed emails per school

### Components:

1. **`AllowedEmailsContent`** -- EXISTS in clone (`src/modules/admin/components/AllowedEmailsContent.tsx`)
   - Props: `user`, `schools`, `backHref`, `defaultSchoolId`

### Tasks:

- [ ] 5.2.1 Create route `src/routes/_authenticated/_superadmin/admin.allowlist.tsx`
- [ ] 5.2.2 Wire `AllowedEmailsContent` component
- [ ] 5.2.3 Test: add email to allowlist, verify blocklist interaction

## 5.3 -- Super Admin Invites Page

**Route:** `src/routes/_authenticated/_superadmin/admin.invites.tsx` (NEW)  
**Original reference:** `app/admin/invites/page.tsx`

### Page structure:

- Back to dashboard link
- Title "Super Admin Invites"
- Invite generation form: email input
- Pending invites table: email, created date, status, revoke button

### Components:

1. **`SuperAdminInviteSection`** -- EXISTS in clone (`src/modules/admin/components/SuperAdminInviteSection.tsx`)
   - Props: `initialInvites`

### Data fetching:

```
InviteService.list()
InviteService.create(email, createdById)
InviteService.revoke(id)
```

### Tasks:

- [ ] 5.3.1 Create route `src/routes/_authenticated/_superadmin/admin.invites.tsx`
- [ ] 5.3.2 Wire `SuperAdminInviteSection` component
- [ ] 5.3.3 Test: create invite, see it in list, revoke it

## 5.4 -- Audit Log Page

**Route:** `src/routes/_authenticated/_superadmin/admin.audit-log.tsx` (NEW)  
**Original reference:** `app/admin/audit-log/page.tsx`

### Page structure:

- Paginated table of audit log entries
- Columns: timestamp, user, action, target, school, details
- Filters: date range, action type, user, school
- Export option

### Components to create:

1. **`AuditLogContent`** (`src/modules/admin/components/AuditLogContent.tsx`) -- PORT from original
   - Props: `user`, `schools`
   - Uses `AuditLogService` from `src/models/audit/services/AuditLogService.ts`

### Model needed:

- `src/models/audit/services/AuditLogService.ts` -- CHECK if exists in clone, PORT if not
  - The `audit_log` table migration exists (migration 084)
  - Service methods: `getAll(limit, offset, filters)`, `getBySchoolId(schoolId)`

### Tasks:

- [ ] 5.4.1 Check/port `AuditLogService` model
- [ ] 5.4.2 Port `AuditLogContent` component
- [ ] 5.4.3 Create route `src/routes/_authenticated/_superadmin/admin.audit-log.tsx`
- [ ] 5.4.4 Test: view audit log with filters and pagination

## 5.5 -- Reports Page

**Route:** `src/routes/_authenticated/_superadmin/admin.reports.tsx` (NEW)  
**Original reference:** `app/admin/reports/page.tsx`

### Page structure:

- School picker + term picker
- Stats cards: total students, total minutes, average per student, active students
- Charts: weekly activity trend, house comparison, activity type distribution
- Download CSV for each report

### Components to port:

1. **`ReportsContent`** (`src/modules/admin/components/ReportsContent.tsx`) -- PORT from original
   - Props: `user`, `schools`, `currentTerm`
   - Uses: Recharts for bar/line charts

### Data aggregation needed:

- Activity sums per school/term/week
- User registration stats
- Challenge participation rates
- Leaderboard snapshots

### Tasks:

- [ ] 5.5.1 Port `ReportsContent` component
- [ ] 5.5.2 Create route `src/routes/_authenticated/_superadmin/admin.reports.tsx`
- [ ] 5.5.3 Wire school picker + term picker
- [ ] 5.5.4 Test: view reports for different schools and terms

## 5.6 -- Analytics Page (new placeholder)

**Route:** `src/routes/_authenticated/_superadmin/admin.analytics.tsx` (NEW)  
**Original reference:** `app/admin/analytics/page.tsx` (was a stub -- "coming soon")

### Page structure:

- Placeholder with "Analytics dashboard coming soon"
- Same as original -- this is a future feature

### Tasks:

- [ ] 5.6.1 Create route with placeholder content
- [ ] 5.6.2 Add to admin navigation

## 5.7 -- Settings Page

**Route:** `src/routes/_authenticated/_superadmin/admin.settings.tsx` (NEW)  
**Original reference:** `app/admin/settings/page.tsx`

### Page structure:

- School term management (start/end dates, clear per-term)
- Points system configuration (1 min = 1 point, multipliers)
- Max activity rules (max minutes per activity/day/week)
- School competition settings

### Components:

1. **`TermManagementContent`** -- EXISTS in clone at `src/modules/admin/components/settings/TermManagementContent.tsx`
   - Props: `user`, `schools`

### Tasks:

- [ ] 5.7.1 Create route `src/routes/_authenticated/_superadmin/admin.settings.tsx`
- [ ] 5.7.2 Wire `TermManagementContent` component
- [ ] 5.7.3 Test: create/update school terms

---

# PHASE 6 -- ASSEMBLY MODE ENHANCEMENTS

**Priority:** MEDIUM | **Estimated Effort:** 2-3 days  
**Goal:** Complete assembly mode with missing slides from the original.

## 6.1 -- Missing Assembly Slides

The clone is missing these assembly slides that exist in the original:

### Slides to port:

1. **`HouseBadgeSlide`** (`src/modules/admin/components/assembly/HouseBadgeSlide.tsx`) -- PORT
   - Displays house badges/achievements earned by the house as a whole
   - From Trello: "House Badges - competitions that each house can earn the badge as a house"

2. **`HouseStatisticsSlide`** (`src/modules/admin/components/assembly/HouseStatisticsSlide.tsx`) -- PORT
   - Displays per-house statistics (total minutes, active members, avg points)

3. **`SchoolLeaderboardSlide`** (`src/modules/admin/components/assembly/SchoolLeaderboardSlide.tsx`) -- PORT
   - From Trello: "Add a school leaderboard on Assembly mode"
   - School vs school comparison for inter-school competition

4. **`WinnersGallerySlide`** (`src/modules/admin/components/assembly/WinnersGallerySlide.tsx`) -- PORT
   - Gallery of assembly draw winners

5. **`ChallengeSlide`** -- ALREADY EXISTS in clone

### Trello Assembly improvements from "Delivered to UAT":

- Total house points in assembly: show per term AND last 7 days
- Assembly leaderboards: show latest points in last 7 days, top 5 per house
- Top scorers by month: include teachers/staff who logged activity
- Remove "come see the office to collect your prize" text

### Tasks:

- [ ] 6.1.1 Port `HouseBadgeSlide.tsx`
- [ ] 6.1.2 Port `HouseStatisticsSlide.tsx`
- [ ] 6.1.3 Port `SchoolLeaderboardSlide.tsx`
- [ ] 6.1.4 Port `WinnersGallerySlide.tsx`
- [ ] 6.1.5 Wire all slides into `AssemblyPresentationContent` slide rotation
- [ ] 6.1.6 Update `AssemblyService` to support 7-day rolling windows
- [ ] 6.1.7 Test: run assembly presentation with all slides

---

# PHASE 7 -- TRELLO RECOMMENDATIONS

**Priority:** MEDIUM | **Estimated Effort:** 5-8 days  
**Goal:** Implement recommendations from the Trello project hub.

## 7.1 -- High Priority Items

### 7.1.1 -- Class field on sign up & profile

**Source:** Trello "Scoped" list  
**Status:** Database field `class` exists on users table (migration 082)

- [ ] Add Class field to onboarding wizard (Step 3, year group step)
- [ ] Add Class field to user profile edit (admin and self)
- [ ] Display Class in admin user tables
- [ ] Add Class filter option to activity logs

### 7.1.2 -- Image/MP4 upload for challenges

**Source:** Trello "In Progress"  
**Status:** `EventImageUpload` exists in clone, need `ChallengeMediaUpload` for video

- [ ] Port `ChallengeMediaUpload` component for video (MP4) upload
- [ ] Add video URL field to events/challenges table (check if migration 079 covers this)
- [ ] Display video in challenge detail page with video player

### 7.1.3 -- Wrap description column in tables

**Source:** Trello "Delivered to UAT"

- [ ] Review all tables with description columns (challenges, events, badges)
- [ ] Add proper text wrapping / truncation with expand option
- [ ] Ensure URLs in descriptions are clickable

### 7.1.4 -- Edit student record (full edit)

**Source:** Trello "Delivered to UAT"

- [ ] Allow admin to edit: year level, house, first name, last name, class
- [ ] Currently: user edit gated behind `isSuperAdmin` at `UserManagementContent.tsx:679` (from audit)
- [ ] Fix: allow school admin to edit their own students' records

### 7.1.5 -- Multiple email domains per school

**Source:** Trello "Delivered to UAT"

- [ ] Currently: only one `email_domain` field. Add `secondary_email_domain` support
- [ ] Update registration/onboarding domain matching to check both domains
- [ ] Add "Secondary Domain" field to school create/edit dialog
- [ ] Migration check: field `secondary_email_domain` exists?

### 7.1.6 -- Points per term vs per year

**Source:** Trello "Delivered to UAT"

- [ ] Add term selector to leaderboards
- [ ] Show term-specific points AND all-time points
- [ ] Assembly: show term totals with total points as well
- [ ] Use `SchoolTermService` to determine current term

### 7.1.7 -- All houses on leaderboard (not just top 4)

**Source:** Trello "Delivered to UAT"

- [ ] Update `HouseService.getLeaderboard()` to return all houses
- [ ] Remove hard-coded limit of 4
- [ ] Ensure scrollable list if many houses

## 7.2 -- Medium Priority Items

### 7.2.1 -- Kōrero notification dot

**Source:** Trello "Delivered to UAT"

- [ ] Add kōrero link to school admin mobile bottom nav
- [ ] Implement unread notification dot/badge
- [ ] Show unread count

### 7.2.2 -- Downloadable promotional materials

**Source:** Trello "Delivered to UAT"

- [ ] Add download buttons to media/assets management
- [ ] Group assets by category (posters, social media, logos)
- [ ] Show file size and format

### 7.2.3 -- Deleting users properly

**Source:** Trello "Delivered to UAT" -- multiple bugs  
**Audit findings:**

- `is_deleted` users not filtered in triggers → their points still contribute to house totals
- Deleting from teacher dashboard doesn't recalculate points
- [ ] Fix: ensure deletion triggers recalculation of all aggregations
- [ ] Fix: filter `is_deleted=true` users from all aggregate queries
- [ ] Migration: add WHERE is_deleted=false to relevant triggers

### 7.2.4 -- Activity type scooter/skate icon

**Source:** Trello "Scoped"

- [ ] Check current activity types list
- [ ] Add scooter/skateboarding activity type if missing
- [ ] Add SVG icon in glyphs

### 7.2.5 -- School admin ability to change student year/house

**Source:** Trello (multiple items)

- [ ] Remove `isSuperAdmin` gate from `UserManagementContent`
- [ ] Allow school_admins to edit students in their own school
- Fields editable: house_id, year_level, class

## 7.3 -- Low Priority Items (Phase 2+)

### 7.3.1 -- Future AI-generated badges

- Placeholder: set up badge creation UX to support AI integration later

### 7.3.2 -- Teacher/staff house contributions

- Staff should be able to contribute points to their house (if they belong to Teachers/Staff house)

### 7.3.3 -- CSV upload for emails (allowlist/blocklist)

- Bulk import via CSV file upload

### 7.3.4 -- Re-engagement mechanics

- No activity for X days → fire re-engagement email

---

# PHASE 8 -- BUG FIXES & TECHNICAL DEBT (from audit)

**Priority:** HIGH | **Estimated Effort:** 3-5 days  
**Source:** Code Changes audit document (Tab 2)

## Critical Bugs

### 8.1 -- `houses.total_points` sums `final_points` instead of `house_points_awarded`

- [ ] Review database triggers/functions
- [ ] Fix: use `house_points_awarded` for house totals
- [ ] Recalculate all house totals after fix

### 8.2 -- `is_deleted` users not filtered in triggers

- [ ] Review all aggregation triggers
- [ ] Add `WHERE is_deleted = false` to:
  - House point totals
  - School point totals
  - Leaderboard calculations
  - School student counts

### 8.3 -- `distance_km` not populated on activities

- [ ] Check if distance calculation is implemented
- [ ] If not: create conversion logic (optional feature)

### 8.4 -- Walking conversion rate low

- [ ] Review `calculatePoints` utility
- [ ] Fix walking distance:time conversion if applicable

### 8.5 -- `getUserPointsBreakdown()` fails to detect fixed-challenge activities

- [ ] Review the function logic
- [ ] Ensure fixed-point challenges are correctly categorized

### 8.6 -- House leaderboard limited to 4 places

- [ ] Remove hard limit
- [ ] Add scroll/pagination for large schools

### 8.7 -- Top scorers using lifetime instead of 7-day rolling

- [ ] Update assembly queries to use date range filters
- [ ] Use `getHousePointsForDateRange` and `getTopScorersByHouseForDateRange`

---

# PHASE 9 -- NAVIGATION & LAYOUT

**Priority:** HIGH | **Estimated Effort:** 2-3 days  
**Goal:** Complete navigation components and connect all routes.

## 9.1 -- Navigation Components

### Components to wire (already exist in clone):

1. **`MainNavigation`** -- top navbar for desktop
2. **`MobileBottomNav`** -- bottom nav for student mobile
3. **`AdminMobileBottomNav`** -- bottom nav for admin mobile
4. **`ConditionalNavigation`** -- role-based nav switching
5. **`NavigationProgress`** -- loading bar during navigation

### Links to add/update:

- Student nav: Dashboard, Activities, Events, Leaderboard, Achievements, Profile
- School admin nav: Dashboard, Users, Activities, Events, Updates, Messages, Assembly, Leaderboard
- Super admin nav: Dashboard, Schools, Users, Events, Houses, Badges, Media, Assembly, Surveys, Audit Log, Reports, Settings, Invites, Allowlist, Deleted Users, Analytics

### Tasks:

- [ ] 9.1.1 Update navigation link paths for all new routes
- [ ] 9.1.2 Add survey prompt indicator to student nav
- [ ] 9.1.3 Add kōrero notification badge to admin nav
- [ ] 9.1.4 Wire navigation into `__root.tsx` or authenticated layout
- [ ] 9.1.5 Ensure active route highlighting works

---

# PHASE 10 -- EMAIL SYSTEM

**Priority:** MEDIUM | **Estimated Effort:** 2-3 days  
**Goal:** Complete email templates and re-engagement system.

## 10.1 -- Email Templates

### From Trello: "Re-engagement comms"

- No activity for X days → fire an email

### Email types to implement:

1. **Welcome (student)** -- after registration/onboarding
2. **Welcome (school admin)** -- after school registration approval
3. **School registration pending** -- acknowledge self-registration
4. **School registration approved** -- school now active
5. **Achievement earned** -- congratulatory email
6. **Challenge completed** -- acknowledgement
7. **Re-engagement (7 days inactive)** -- nudge
8. **Re-engagement (14 days inactive)** -- stronger nudge
9. **Survey available** -- prompt to take survey
10. **Password reset** -- Supabase handles this natively

### Components:

- `src/lib/sendEmail.ts` -- ALREADY EXISTS in clone
- `src/emails/index.ts` -- ALREADY EXISTS in clone
- Email templates in `src/emails/`

### Tasks:

- [ ] 10.1.1 Review existing email templates in clone
- [ ] 10.1.2 Create re-engagement email templates
- [ ] 10.1.3 Create achievement/challenge email templates
- [ ] 10.1.4 Implement re-engagement check (cron or on-login trigger)
- [ ] 10.1.5 Test: emails send correctly with brand styling

---

# PHASE 11 -- POLISH & PERFORMANCE

**Priority:** MEDIUM | **Estimated Effort:** 3-5 days  
**Goal:** Loading states, error handling, mobile responsiveness, empty states.

## 11.1 -- Loading States & Skeletons

### Components (already exist in clone):

1. **`AdminPageSkeleton`** (`src/modules/application/components/skeletons/AdminPageSkeleton.tsx`)
2. **`UserPageSkeleton`** (`src/modules/application/components/skeletons/UserPageSkeleton.tsx`)

### Tasks:

- [ ] 11.1.1 Add skeleton loading to all pages that fetch data
- [ ] 11.1.2 Use React Suspense for async route loading
- [ ] 11.1.3 Add loading spinners to buttons during mutations

## 11.2 -- Error Handling

### Components:

- Error boundary in `__root.tsx` -- EXISTS
- Error page in `src/lib/error-page.ts` -- EXISTS
- `notifyAboutError` utility -- EXISTS

### Tasks:

- [ ] 11.2.1 Add error boundaries around data-dependent sections
- [ ] 11.2.2 Add toast-based error handling for all mutations
- [ ] 11.2.3 Handle Supabase errors gracefully (auth expiry, network)
- [ ] 11.2.4 Add retry buttons for failed data fetches

## 11.3 -- Empty States

### Tasks:

- [ ] 11.3.1 No activities logged → prompt to log first activity
- [ ] 11.3.2 No achievements earned → encouragement message
- [ ] 11.3.3 No events available → "check back soon"
- [ ] 11.3.4 No leaderboard data → "be the first to log activity"
- [ ] 11.3.5 No users in school → share sign-up link prompt

## 11.4 -- Mobile Responsiveness

### Tasks:

- [ ] 11.4.1 Test all pages at 375px, 768px, 1024px, 1440px
- [ ] 11.4.2 Fix overflow/truncation issues on narrow screens
- [ ] 11.4.3 Ensure navigation works on mobile (bottom nav)
- [ ] 11.4.4 Test assembly presentation mode on various screen sizes

## 11.5 -- Brand Consistency

### Brand colors (from original globals.css):

```
Primary Green: #0B4B39
Supporting Green: #0F8061
Accent Magenta: #D103D1
Pink: #DB4FDB
Background Grey: #F0EFEB
Destructive Red: #EF4250
```

### Tasks:

- [ ] 11.5.1 Audit all components for brand color usage
- [ ] 11.5.2 Use CSS custom properties / Tailwind theme extension
- [ ] 11.5.3 Verify Inter font loading
- [ ] 11.5.4 Check Karawhiua logo appears correctly on all pages

---

# PHASE 12 -- FINAL INTEGRATION & TESTING

**Priority:** HIGH | **Estimated Effort:** 3-4 days  
**Goal:** End-to-end testing of all flows, connect all documentation, final push to Lovable.

## 12.1 -- Flow Testing

### Student flow:

1. Lands on `/` → redirected to `/auth`
2. Signs up (email or Google) → redirected to `/onboarding`
3. Completes onboarding (selects school, house, year, class) → redirected to `/dashboard`
4. Dashboard shows: greeting, monthly progress, achievements, streak, recent activities
5. Logs activity via FAB → `/activities` → LogActivityWizard (6 steps)
6. Views events → `/events` → sees published challenges → joins one → `/events/$id`
7. Logs activity against a challenge → points multiplier applied
8. Views leaderboard → `/leaderboard` → sees house/school/overall rankings
9. Views achievements → `/achievements` → sees earned/unearned badges
10. After 3 weeks → survey prompt appears → `/survey` → completes Survey 1
11. Views profile → `/profile` → sees account details
12. Participates in kōrero → `/korero` → submits vote

### School admin flow:

1. Logs in → redirected to `/school` (school admin dashboard)
2. Manages users → `/school/users` → promotes teacher, edits student
3. Creates challenge → `/school/events` → fills form → publishes
4. Reviews activities → `/school/activity` → rejects flagged activity
5. Posts update → `/school/updates` → creates message
6. Manages messages → `/school/messages` → views inbox
7. Configures assembly → `/school/assembly` → sets up slides → presents
8. Views leaderboard → `/school/leaderboard` → sees school data

### Super admin flow:

1. Logs in → redirected to `/admin` (super admin dashboard)
2. Manages schools → `/admin/schools` → creates, edits, toggles active
3. Approves pending schools → `/admin/schools/pending` → approves/rejects
4. Manages global users → `/admin/users` → promotes, deletes, restores
5. Approves events → `/admin/events` → approves student-suggested challenges
6. Manages houses → `/admin/houses` → CRUD for all schools
7. Manages badges → `/admin/badges` → CRUD with image upload
8. Manages media → `/admin/media` → uploads promotional assets
9. Views audit log → `/admin/audit-log` → filters and reviews
10. Views reports → `/admin/reports` → school/term reports
11. Manages surveys → `/admin/surveys` → views results and response rates
12. Manages allowlist → `/admin/allowlist` → adds emails
13. Manages invites → `/admin/invites` → generates super admin invites
14. Manages terms → `/admin/settings` → CRUD school terms

### School registration flow:

1. New school visits `/register-school` → 4-step wizard
2. Step 1: School name, region, type
3. Step 2: Email domains, domain availability check
4. Step 3: House configuration (defaults + custom)
5. Step 4: Admin account (Google or email)
6. Submit → school created as pending → super admins notified

### Join by code flow:

1. Student visits `/join/ABC123` → sees school name
2. Signs in or creates account → redirected to onboarding
3. Onboarding pre-fills school from code → completes house/year/class

## 12.2 -- Resource Integration

- [ ] 12.2.1 Badge images: verify all 30+ badge PNGs are in `public/badges/`
- [ ] 12.2.2 Activity glyphs: verify all 36+ SVGs are in `public/glyphs/`
- [ ] 12.2.3 Assembly icons: verify all 10 assembly SVGs are in `public/assembly/`
- [ ] 12.2.4 Logos: verify `KarawhiuaLogo.png`, `KarawhiuaLogoOld.png`, `Logo.svg`
- [ ] 12.2.5 Favicons from `Karawhiua Favicons.zip`
- [ ] 12.2.6 Brand color palette from `colour palette.png`
- [ ] 12.2.7 Promotional PDFs from resources folder

---

# Summary: Route Creation Checklist

| #   | Route File                                           | Status       |
| --- | ---------------------------------------------------- | ------------ |
| 1   | `_authenticated/dashboard.tsx`                       | REPLACE stub |
| 2   | `_authenticated/achievements.tsx`                    | REPLACE stub |
| 3   | `_authenticated/survey.tsx`                          | **NEW**      |
| 4   | `_authenticated/challenges.my-suggestions.tsx`       | **NEW**      |
| 5   | `_authenticated/_admin/school.messages.tsx`          | REPLACE stub |
| 6   | `_authenticated/_admin/school.events.tsx`            | **NEW**      |
| 7   | `_authenticated/_admin/school.activity.tsx`          | **NEW**      |
| 8   | `_authenticated/_superadmin/admin.deleted-users.tsx` | **NEW**      |
| 9   | `_authenticated/_superadmin/admin.allowlist.tsx`     | **NEW**      |
| 10  | `_authenticated/_superadmin/admin.invites.tsx`       | **NEW**      |
| 11  | `_authenticated/_superadmin/admin.audit-log.tsx`     | **NEW**      |
| 12  | `_authenticated/_superadmin/admin.reports.tsx`       | **NEW**      |
| 13  | `_authenticated/_superadmin/admin.analytics.tsx`     | **NEW**      |
| 14  | `_authenticated/_superadmin/admin.settings.tsx`      | **NEW**      |
| 15  | `_authenticated/_superadmin/admin.surveys.tsx`       | **NEW**      |

# Summary: Component Creation Checklist

| #   | Component                    | Action                             |
| --- | ---------------------------- | ---------------------------------- |
| 1   | `StudentProgressionCard.tsx` | PORT from original                 |
| 2   | `DashboardContent.tsx`       | PORT from original (adapt imports) |
| 3   | `AchievementsGrid.tsx`       | CREATE new                         |
| 4   | `SurveyPageContent.tsx`      | PORT from original                 |
| 5   | `SurveyModal.tsx`            | PORT from original                 |
| 6   | `SurveyQuestion.tsx`         | PORT from original                 |
| 7   | `SurveyDismissButton.tsx`    | PORT from original                 |
| 8   | `SurveyPromptCard.tsx`       | PORT from original                 |
| 9   | `AdminSurveysContent.tsx`    | PORT from original                 |
| 10  | `MySuggestionsContent.tsx`   | PORT from original                 |
| 11  | `ChallengeMediaUpload.tsx`   | PORT from original                 |
| 12  | `AuditLogContent.tsx`        | PORT from original                 |
| 13  | `ReportsContent.tsx`         | PORT from original                 |
| 14  | `HouseBadgeSlide.tsx`        | PORT from original                 |
| 15  | `HouseStatisticsSlide.tsx`   | PORT from original                 |
| 16  | `SchoolLeaderboardSlide.tsx` | PORT from original                 |
| 17  | `WinnersGallerySlide.tsx`    | PORT from original                 |

# Summary: Model/Service Checklist

| #   | Model                                   | Action                                   |
| --- | --------------------------------------- | ---------------------------------------- |
| 1   | `surveys/SurveyService.ts`              | PORT + ENHANCE with 4 surveys from brief |
| 2   | `audit/AuditLogService.ts`              | CHECK/PORT from original                 |
| 3   | `surveys/interfaces/SurveyInterface.ts` | PORT + ADD new survey types              |

# Summary: Migration Checklist

| #   | Migration                                    | Purpose                                                         |
| --- | -------------------------------------------- | --------------------------------------------------------------- |
| 1   | Check survey tables exist                    | surveys, survey_questions, survey_responses, user_survey_status |
| 2   | Check `secondary_email_domain` on schools    | Multiple domains per school                                     |
| 3   | Check `class` field on users                 | Class option for sign up                                        |
| 4   | Check audit_log table has all needed columns | Filters and export                                              |

---

## Appendix A: Migration Notes (Next.js → TanStack Start)

### Server Components → Route Loaders

```typescript
// Next.js (server component)
export default async function Page() {
  const supabase = await createSupabaseServer();
  const data = await service.getData();
  return <ClientComponent initialData={data} />;
}

// TanStack Start (route with beforeLoad + component)
export const Route = createFileRoute('/_authenticated/dashboard')({
  beforeLoad: async ({ context }) => {
    const supabase = createServerClient();
    const data = await service.getData();
    return { data };
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const { data } = Route.useRouteContext();
  return <ClientComponent initialData={data} />;
}
```

### Redirects

```typescript
// Next.js
import { redirect } from "next/navigation";
redirect("/dashboard");

// TanStack Start
import { redirect } from "@tanstack/react-router";
throw redirect({ to: "/dashboard" });
```

### Router Refresh → Query Invalidation

```typescript
// Next.js
import { useRouter } from "next/navigation";
const router = useRouter();
router.refresh();

// TanStack Start
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
```

### Links

```typescript
// Next.js
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>

// TanStack Start
import { Link } from '@tanstack/react-router';
<Link to="/dashboard">Dashboard</Link>
```

### Server Actions → Server Functions

```typescript
// Next.js
'use server'
export async function myAction(data: FormData) { ... }

// TanStack Start
import { createServerFn } from '@tanstack/react-start';
export const myFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => mySchema.parse(data))
  .handler(async ({ data }) => { ... });
```

### Image

```typescript
// Next.js
import Image from 'next/image';
<Image src="/fire.png" alt="Fire" width={64} height={64} />

// TanStack Start (Vite)
<img src="/fire.png" alt="Fire" width={64} height={64} />
```

### useSearchParams → useSearch

```typescript
// Next.js
import { useSearchParams } from "next/navigation";
const searchParams = useSearchParams();
const schoolId = searchParams.get("schoolId");

// TanStack Start
import { useSearch } from "@tanstack/react-router";
const search = useSearch({ from: "/admin/activity" });
const schoolId = search.schoolId;
```

---

## Appendix B: Supabase Project Info

- **Project ID:** `zxxhjkruhwjondrbftaf`
- **URL:** `https://zxxhjkruhwjondrbftaf.supabase.co`
- **Migrations:** 83 applied
- **Storage buckets:** badges, promotional-assets, event-images, school-updates
- **Auth:** Email/password + Google OAuth
- **RLS:** Row-level security enforced on all tables
- **RPC functions:** 25+ (rankings, streaks, recalculations)

## Appendix C: Environment Variables

```
VITE_SUPABASE_URL=https://zxxhjkruhwjondrbftaf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
RESEND_API_KEY=<resend-key>
VITE_FROM_EMAIL=noreply@app.karawhiua.app
VITE_APP_URL=https://app.karawhiua.app
```

## Appendix D: Trello Board Reference

**Board:** "Karawhiua Project Hub" (135 cards, 9 lists)
**URL:** https://trello.com/b/DaUFOYcj/karawhiua-project-hub

Lists: Parked (26), To Do (9), To Scope (6), Scoped (3), Internal Test QA (11), In Progress (1), Delivered to UAT (14), Delivered to Prod (5), Completed (60)
