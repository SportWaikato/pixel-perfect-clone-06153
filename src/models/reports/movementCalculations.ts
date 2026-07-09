/**
 * Movement reporting calculations aligned with MWYS 2024 and Voice of Rangatahi 2023.
 * All calculations are pure functions — no Supabase dependency. Supply data from your
 * existing queries and these functions compute the derived fields.
 */

const SIX_HOURS_MINUTES = 360;

/** How many minutes in the given Date range did this user log? */
export function actualTotalMinutes(activities: { duration_minutes: number; created_at: string }[], startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return activities
    .filter((a) => {
      const t = new Date(a.created_at).getTime();
      return t >= start && t <= end;
    })
    .reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
}

/** actual_total_minutes / 60 */
export function actualTotalHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/** Did the user log >= 360 minutes in the period? */
export function meetsSixHourGuideline(totalMinutes: number): boolean {
  return totalMinutes >= SIX_HOURS_MINUTES;
}

/** Is the self-reported weekly-hours band "6+ hours"? */
export function surveyMeetsGuideline(weeklyHoursBand: string | null): boolean {
  return weeklyHoursBand === "6+ hours";
}

type AlignmentStatus = "Aligned" | "Reported higher than recorded" | "Recorded higher than reported" | "Insufficient data";

/** Compare self-reported vs actual movement */
export function alignmentStatus(weeklyHoursBand: string | null, actualMinutes: number): AlignmentStatus {
  const reportedMeets = surveyMeetsGuideline(weeklyHoursBand);
  const actualMeets = meetsSixHourGuideline(actualMinutes);
  if (!weeklyHoursBand || actualMinutes === 0) return "Insufficient data";
  if (reportedMeets === actualMeets) return "Aligned";
  return reportedMeets ? "Reported higher than recorded" : "Recorded higher than reported";
}

/** Is the satisfaction response in the top-two-box (Very satisfied or Extremely satisfied)? */
export function isTopTwoBox(response: string | null): boolean {
  return response === "Very satisfied" || response === "Extremely satisfied";
}

/** Count unique respondents per option for multi-select questions */
export function countMultiSelectResponse(allAnswers: string[][], option: string): number {
  return allAnswers.filter((answers) => answers.includes(option)).length;
}

/** Sum school totals to get region total */
export function regionTotal(schools: { total_minutes?: number; total_points?: number; total_students?: number }[]): {
  totalMinutes: number;
  totalPoints: number;
  totalStudents: number;
} {
  return schools.reduce(
    (acc, s) => ({
      totalMinutes: acc.totalMinutes + (s.total_minutes || 0),
      totalPoints: acc.totalPoints + (s.total_points || 0),
      totalStudents: acc.totalStudents + (s.total_students || 0),
    }),
    { totalMinutes: 0, totalPoints: 0, totalStudents: 0 },
  );
}

/** Sum region totals to get national total */
export function nationalTotal(regions: { totalMinutes: number; totalPoints: number; totalStudents: number }[]): {
  totalMinutes: number;
  totalPoints: number;
  totalStudents: number;
} {
  return regions.reduce(
    (acc, r) => ({
      totalMinutes: acc.totalMinutes + r.totalMinutes,
      totalPoints: acc.totalPoints + r.totalPoints,
      totalStudents: acc.totalStudents + r.totalStudents,
    }),
    { totalMinutes: 0, totalPoints: 0, totalStudents: 0 },
  );
}

/** Anonymise a UUID by truncating to first 8 chars */
export function anonymiseId(id: string): string {
  return id.slice(0, 8) + "...";
}
