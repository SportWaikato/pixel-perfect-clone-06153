import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  actualTotalMinutes,
  meetsSixHourGuideline,
  surveyMeetsGuideline,
  alignmentStatus,
  isTopTwoBox,
} from "@/models/reports/movementCalculations";

// Returns comparison between self-reported movement (survey) and actual logged activity.
// Super-admin only — aggregates all schools.
export const fetchMovementDiscrepancy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: caller, error: callerError } = await context.supabase
      .from("users")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (callerError) throw new Error(callerError.message);
    if (caller?.role !== "super_admin") throw new Error("Forbidden");

    // Fetch movement_measures survey responses with the weekly hours question
    const { data: responses, error: respErr } = await context.supabase
      .from("survey_responses")
      .select(`
        user_id,
        answer,
        question:survey_questions!inner(question_text, display_order),
        survey:surveys!inner(survey_type)
      `)
      .eq("survey.survey_type", "movement_measures");

    if (respErr) throw new Error(respErr.message);
    if (!responses?.length) return { items: [], summary: { totalRespondents: 0, aligned: 0, reportedHigher: 0, recordedHigher: 0, insufficientData: 0, satisfactionTopTwoBox: 0 } };

    // Group responses by user
    const userMap = new Map<string, { weeklyHours?: string; satisfaction?: string }>();
    for (const r of responses as any[]) {
      const u = userMap.get(r.user_id) || {};
      if (r.question?.display_order === 2) u.weeklyHours = r.answer; // weekly hours question
      if (r.question?.display_order === 6) u.satisfaction = r.answer; // satisfaction question
      userMap.set(r.user_id, u);
    }

    // Fetch actual activity totals for these users (last 30 days)
    const userIds = [...userMap.keys()];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activities, error: actErr } = await context.supabase
      .from("activities")
      .select("user_id, duration_minutes, created_at")
      .in("user_id", userIds)
      .gte("created_at", thirtyDaysAgo)
      .is("is_rejected", false);

    if (actErr) throw new Error(actErr.message);

    // Calculate comparison
    const items: {
      userId: string;
      weeklyHoursBand: string | null;
      actualMinutes: number;
      reportedMeets: boolean;
      actualMeets: boolean;
      status: ReturnType<typeof alignmentStatus>;
      satisfactionTopTwoBox: boolean;
    }[] = [];

    for (const [userId, survey] of userMap) {
      const userActs = (activities || []).filter((a: any) => a.user_id === userId);
      const actualMins = actualTotalMinutes(userActs as any, thirtyDaysAgo, new Date().toISOString());
      const reportedMeets = surveyMeetsGuideline(survey.weeklyHours || null);
      const actualMeets = meetsSixHourGuideline(actualMins);

      items.push({
        userId: userId.slice(0, 8) + "...",
        weeklyHoursBand: survey.weeklyHours || null,
        actualMinutes: actualMins,
        reportedMeets,
        actualMeets,
        status: alignmentStatus(survey.weeklyHours || null, actualMins),
        satisfactionTopTwoBox: isTopTwoBox(survey.satisfaction || null),
      });
    }

    const summary = {
      totalRespondents: items.length,
      aligned: items.filter((i) => i.status === "Aligned").length,
      reportedHigher: items.filter((i) => i.status === "Reported higher than recorded").length,
      recordedHigher: items.filter((i) => i.status === "Recorded higher than reported").length,
      insufficientData: items.filter((i) => i.status === "Insufficient data").length,
      satisfactionTopTwoBox: items.filter((i) => i.satisfactionTopTwoBox).length,
    };

    return { items, summary };
  });
