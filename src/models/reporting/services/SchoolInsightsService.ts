import { SupabaseClient } from "@supabase/supabase-js";

export interface SchoolInsightsReport {
  schoolName: string;
  schoolCode: string;
  rollNumber: number;
  totalStudents: number;
  totalRespondents: number;
  // Satisfaction
  competitiveSportSatisfaction: SatisfactionBreakdown;
  socialSportSatisfaction: SatisfactionBreakdown;
  // Participation
  clubRepParticipation: ClubParticipationBreakdown;
  // Activity vs Preference Gap
  topLoggedActivities: ActivityFrequency[];
  topPreferredSports: ActivityFrequency[];
  // Barriers
  topBarriers: ActivityFrequency[];
  // Activity Stats
  totalMinutes: number;
  totalActivities: number;
  averageMinutesPerStudent: number;
  // Activity Context breakdown
  activityContextBreakdown: Record<string, number>;
  // Participation type breakdown
  soloVsTeamBreakdown: Record<string, number>;
  // Term breakdowns
  termActivityTrends: TermTrend[];
}

interface SatisfactionBreakdown {
  satisfiedCount: number;    // "Extremely satisfied" + "Very satisfied"
  satisfiedPercent: number;
  totalResponses: number;
}

interface ClubParticipationBreakdown {
  clubCount: number;
  repCount: number;
  bothCount: number;
  noneCount: number;
  totalResponses: number;
  clubPercentage: number;    // Any club or rep
  repPercentage: number;     // Any rep
}

interface ActivityFrequency {
  name: string;
  count: number;
  percentage: number;
}

interface TermTrend {
  term: string;
  startDate: string;
  endDate: string;
  minutes: number;
  activities: number;
  uniqueStudents: number;
}

export class SchoolInsightsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getSchoolInsights(schoolId: string, startDate?: string, endDate?: string): Promise<SchoolInsightsReport> {
    const today = new Date().toISOString().split("T")[0];
    const from = startDate || `${new Date().getFullYear()}-01-01`;
    const to = endDate || today;

    const schoolData = await this.getSchoolData(schoolId);
    const activityData = await this.getActivityData(schoolId, from, to);
    const surveyData = await this.getSurveyResponses(schoolId);

    const satisfaction = this.calculateSatisfaction(surveyData);
    const clubParticipation = this.calculateClubParticipation(surveyData);
    const topLogged = this.calculateTopActivities(activityData);
    const topPreferred = this.calculateTopPreferences(surveyData);
    const barriers = this.calculateTopBarriers(surveyData);
    const contextBreakdown = this.calculateActivityContext(activityData);
    const teamBreakdown = this.calculateTeamBreakdown(activityData);
    const termTrends = this.calculateTermTrends(activityData);

    return {
      schoolName: schoolData?.name || "",
      schoolCode: schoolData?.code || "",
      rollNumber: (schoolData as any)?.roll_number || 0,
      totalStudents: activityData.totalStudents || 0,
      totalRespondents: surveyData.totalRespondents || 0,
      competitiveSportSatisfaction: satisfaction.competitive,
      socialSportSatisfaction: satisfaction.social,
      clubRepParticipation: clubParticipation,
      topLoggedActivities: topLogged,
      topPreferredSports: topPreferred,
      topBarriers: barriers,
      totalMinutes: activityData.totalMinutes || 0,
      totalActivities: activityData.totalActivities || 0,
      averageMinutesPerStudent: activityData.totalMinutes
        ? Math.round(activityData.totalMinutes / (activityData.totalStudents || 1))
        : 0,
      activityContextBreakdown: contextBreakdown,
      soloVsTeamBreakdown: teamBreakdown,
      termActivityTrends: termTrends,
    };
  }

  private async getSchoolData(schoolId: string) {
    const { data } = await this.supabase
      .from("schools")
      .select("name, code, region, roll_number")
      .eq("id", schoolId)
      .single();
    return data;
  }

  private async getActivityData(schoolId: string, from: string, to: string) {
    const { data: activities } = await this.supabase
      .from("activities")
      .select(`
        id, activity_type, custom_activity_name, duration_minutes,
        participation_type, activity_context, created_at, user_id
      `)
      .eq("is_rejected", false)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`);

    if (!activities) return { totalStudents: 0, totalMinutes: 0, totalActivities: 0, rawActivityTypes: [], raw: [] };

    const { data: schoolUsers } = await this.supabase
      .from("users")
      .select("id")
      .eq("school_id", schoolId);

    const schoolUserIds = new Set((schoolUsers || []).map((u) => u.id));
    const schoolActivities = (activities || []).filter((a) => schoolUserIds.has(a.user_id));

    return {
      totalStudents: schoolUsers?.length || 0,
      totalMinutes: schoolActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
      totalActivities: schoolActivities.length,
      rawActivityTypes: schoolActivities.map((a) => ({
        type: a.activity_type,
        name: a.custom_activity_name || a.activity_type,
        context: a.activity_context,
        participation: a.participation_type,
        date: a.created_at,
      })),
      raw: schoolActivities,
    };
  }

  private async getSurveyResponses(schoolId: string) {
    const { data: schoolUsers } = await this.supabase
      .from("users")
      .select("id, year_group")
      .eq("school_id", schoolId);

    if (!schoolUsers?.length) return { totalRespondents: 0, answers: [] };

    const userIds = schoolUsers.map((u) => u.id);

    const { data: responses } = await this.supabase
      .from("survey_responses")
      .select(`
        answer, user_id,
        question:survey_questions!survey_responses_question_id_fkey(
          id, question_text, survey_id,
          survey:surveys(survey_type, name)
        )
      `)
      .in("user_id", userIds);

    if (!responses) return { totalRespondents: 0, answers: [] };

    const respondentIds = new Set(responses.map((r) => r.user_id));

    return {
      totalRespondents: respondentIds.size,
      answers: responses.map((r) => ({
        userId: r.user_id,
        questionText: (r.question as any)?.question_text || "",
        surveyType: (r.question as any)?.survey?.survey_type || "",
        answer: r.answer,
      })),
    };
  }

  private calculateSatisfaction(surveyData: { totalRespondents: number; answers: any[] }) {
    const competitive = {
      satisfiedCount: 0,
      satisfiedPercent: 0,
      totalResponses: 0,
    };
    const social = {
      satisfiedCount: 0,
      satisfiedPercent: 0,
      totalResponses: 0,
    };

    for (const a of surveyData.answers) {
      if (a.questionText.includes("competitive sport")) {
        competitive.totalResponses++;
        const ans = Array.isArray(a.answer) ? a.answer[0] : String(a.answer);
        if (ans && /extremely|very/.test(ans.toLowerCase())) {
          competitive.satisfiedCount++;
        }
      } else if (a.questionText.includes("social sport")) {
        social.totalResponses++;
        const ans = Array.isArray(a.answer) ? a.answer[0] : String(a.answer);
        if (ans && /extremely|very/.test(ans.toLowerCase())) {
          social.satisfiedCount++;
        }
      }
    }

    competitive.satisfiedPercent = competitive.totalResponses
      ? Math.round((competitive.satisfiedCount / competitive.totalResponses) * 100)
      : 0;
    social.satisfiedPercent = social.totalResponses
      ? Math.round((social.satisfiedCount / social.totalResponses) * 100)
      : 0;

    return { competitive, social };
  }

  private calculateClubParticipation(surveyData: { answers: any[] }): ClubParticipationBreakdown {
    const result: ClubParticipationBreakdown = {
      clubCount: 0,
      repCount: 0,
      bothCount: 0,
      noneCount: 0,
      totalResponses: 0,
      clubPercentage: 0,
      repPercentage: 0,
    };

    for (const a of surveyData.answers) {
      if (a.questionText.includes("club or rep")) {
        result.totalResponses++;
        const ans = Array.isArray(a.answer) ? a.answer[0] : String(a.answer);
        if (ans?.includes("both")) {
          result.bothCount++;
        } else if (ans?.includes("club team") && !ans.includes("rep")) {
          result.clubCount++;
        } else if (ans?.includes("representative") || ans?.includes("rep team")) {
          result.repCount++;
        } else {
          result.noneCount++;
        }
      }
    }

    if (result.totalResponses > 0) {
      const anyClubOrRep = result.clubCount + result.repCount + result.bothCount;
      const anyRep = result.repCount + result.bothCount;
      result.clubPercentage = Math.round((anyClubOrRep / result.totalResponses) * 100);
      result.repPercentage = Math.round((anyRep / result.totalResponses) * 100);
    }

    return result;
  }

  private calculateTopActivities(
    activityData: { rawActivityTypes: Array<{ type: string; name: string }> },
  ): ActivityFrequency[] {
    const freq: Record<string, number> = {};
    let total = 0;
    for (const a of (activityData.rawActivityTypes || [])) {
      const label = a.type === "something_else" ? (a.name || "Other") : a.type;
      freq[label] = (freq[label] || 0) + 1;
      total++;
    }

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }));
  }

  private calculateTopPreferences(
    surveyData: { answers: any[] },
  ): ActivityFrequency[] {
    const freq: Record<string, number> = {};
    let total = 0;

    for (const a of surveyData.answers) {
      if (a.questionText.includes("most interested in")) {
        const answers = Array.isArray(a.answer) ? a.answer : [a.answer];
        for (const ans of answers) {
          if (ans) {
            const key = String(ans);
            freq[key] = (freq[key] || 0) + 1;
            total++;
          }
        }
      }
    }

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }));
  }

  private calculateTopBarriers(
    surveyData: { answers: any[] },
  ): ActivityFrequency[] {
    const freq: Record<string, number> = {};
    let total = 0;

    for (const a of surveyData.answers) {
      if (a.questionText.includes("stops you")) {
        const answers = Array.isArray(a.answer) ? a.answer : [a.answer];
        for (const ans of answers) {
          if (ans && ans !== "Nothing stops me") {
            const key = String(ans);
            freq[key] = (freq[key] || 0) + 1;
            total++;
          }
        }
      }
    }

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }));
  }

  private calculateActivityContext(
    activityData: { rawActivityTypes: Array<{ context: string }> },
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const a of (activityData.rawActivityTypes || [])) {
      if (a.context) {
        breakdown[a.context] = (breakdown[a.context] || 0) + 1;
      }
    }
    return breakdown;
  }

  private calculateTeamBreakdown(
    activityData: { rawActivityTypes: Array<{ participation: string }> },
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const a of (activityData.rawActivityTypes || [])) {
      if (a.participation) {
        const key = a.participation === "with_others" ? "Team / With Others" : "Solo";
        breakdown[key] = (breakdown[key] || 0) + 1;
      }
    }
    return breakdown;
  }

  private calculateTermTrends(
    activityData: { raw: Array<{ duration_minutes: number; created_at: string; user_id: string }> },
  ): TermTrend[] {
    const year = new Date().getFullYear();
    const terms: { label: string; start: string; end: string }[] = [
      { label: "Term 1", start: `${year}-01-27`, end: `${year}-04-11` },
      { label: "Term 2", start: `${year}-04-28`, end: `${year}-06-27` },
      { label: "Term 3", start: `${year}-07-14`, end: `${year}-09-19` },
      { label: "Term 4", start: `${year}-10-06`, end: `${year}-12-19` },
    ];

    return terms.map((term) => {
      const inRange = (activityData.raw || []).filter((a) => {
        const d = (a.created_at || "").slice(0, 10);
        return d >= term.start && d <= term.end;
      });
      const uniqueStudents = new Set(inRange.map((a) => a.user_id)).size;
      return {
        term: term.label,
        startDate: term.start,
        endDate: term.end,
        minutes: inRange.reduce((s, a) => s + (a.duration_minutes || 0), 0),
        activities: inRange.length,
        uniqueStudents,
      };
    });
  }

  async exportSchoolInsightsCSV(schoolId: string, startDate?: string, endDate?: string): Promise<string> {
    const report = await this.getSchoolInsights(schoolId, startDate, endDate);
    const lines: string[] = [];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    lines.push(`${esc(report.schoolName)}`);
    lines.push("School Sport Insights");
    lines.push(`Total on roll: ${report.rollNumber}`);
    lines.push(`Total participants: n=${esc(report.totalStudents)} (survey respondents: n=${esc(report.totalRespondents)})`);
    lines.push(`Participation rate: ${report.rollNumber > 0 ? Math.round((report.totalStudents / report.rollNumber) * 100) : 0}%`);
    lines.push("");

    lines.push("SATISFACTION");
    lines.push(`Competitive Sport Satisfaction,${esc(report.competitiveSportSatisfaction.satisfiedPercent + "%")}`);
    lines.push(`Social Sport Satisfaction,${esc(report.socialSportSatisfaction.satisfiedPercent + "%")}`);
    lines.push("");

    lines.push("CLUB / REPRESENTATIVE PARTICIPATION");
    lines.push(`Play for club or rep team,${esc(report.clubRepParticipation.clubPercentage + "%")}`);
    lines.push(`Play for representative team,${esc(report.clubRepParticipation.repPercentage + "%")}`);
    lines.push(`Club only,${esc(report.clubRepParticipation.clubCount)}`);
    lines.push(`Rep only,${esc(report.clubRepParticipation.repCount)}`);
    lines.push(`Both club and rep,${esc(report.clubRepParticipation.bothCount)}`);
    lines.push(`Neither,${esc(report.clubRepParticipation.noneCount)}`);
    lines.push("");

    lines.push("TOP ACTIVITIES LOGGED");
    lines.push("Sport,Count,%");
    for (const a of report.topLoggedActivities) {
      lines.push(`${esc(a.name)},${a.count},${a.percentage}%`);
    }
    lines.push("");

    lines.push("TOP PREFERRED SPORTS (from survey)");
    lines.push("Sport,Count,%");
    for (const a of report.topPreferredSports) {
      lines.push(`${esc(a.name)},${a.count},${a.percentage}%`);
    }
    lines.push("");

    lines.push("TOP BARRIERS TO PARTICIPATION");
    lines.push("Barrier,Count,%");
    for (const b of report.topBarriers) {
      lines.push(`${esc(b.name)},${b.count},${b.percentage}%`);
    }
    lines.push("");

    lines.push("ACTIVITY CONTEXT BREAKDOWN");
    lines.push("Context,Count");
    for (const [key, count] of Object.entries(report.activityContextBreakdown)) {
      lines.push(`${esc(key)},${count}`);
    }
    lines.push("");

    lines.push("SOLO VS TEAM BREAKDOWN");
    lines.push("Type,Count");
    for (const [key, count] of Object.entries(report.soloVsTeamBreakdown)) {
      lines.push(`${esc(key)},${count}`);
    }
    lines.push("");

    lines.push("TERM TRENDS");
    lines.push("Term,Minutes,Activities,Unique Students");
    for (const t of report.termActivityTrends) {
      lines.push(`${esc(t.term)},${t.minutes},${t.activities},${t.uniqueStudents}`);
    }
    lines.push("");

    lines.push("OVERALL STATS");
    lines.push(`Total Minutes,${report.totalMinutes}`);
    lines.push(`Total Activities,${report.totalActivities}`);
      lines.push(`Average Minutes Per Student,${report.averageMinutesPerStudent}`);

    return lines.join("\n");
  }

  async exportDetailedCSV(schoolId: string, startDate?: string, endDate?: string): Promise<string> {
    const today = new Date().toISOString().split("T")[0];
    const from = startDate || `${new Date().getFullYear()}-01-01`;
    const to = endDate || today;

    const { data: users } = await this.supabase
      .from("users")
      .select("id, first_name, last_name, gender, year_group, house:houses(name)")
      .eq("school_id", schoolId)
      .is("is_deleted", false);

    const userIds = (users || []).map((u) => u.id);

    const { data: activities } = await this.supabase
      .from("activities")
      .select("*")
      .in("user_id", userIds)
      .is("is_rejected", false)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false });

    const { data: surveyResponses } = await this.supabase
      .from("survey_responses")
      .select(`
        user_id, answer,
        question:survey_questions!survey_responses_question_id_fkey(
          question_text,
          survey:surveys(survey_type)
        )
      `)
      .in("user_id", userIds);

    const userMap = new Map((users || []).map((u) => [u.id, u]));
    const surveyByUser: Record<string, Record<string, string>> = {};
    for (const r of (surveyResponses || [])) {
      if (!surveyByUser[r.user_id]) surveyByUser[r.user_id] = {};
      const q = (r.question as any)?.question_text || "";
      const ans = Array.isArray(r.answer) ? (r.answer as string[]).join("; ") : String(r.answer || "");
      surveyByUser[r.user_id][q] = ans;
    }

    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const ctxLabels: Record<string, string> = {
      training: "Training / Practice",
      casual: "For Fun",
      competition: "Competition",
    };

    const headers = [
      "First Name", "Last Name", "Gender", "Year Group", "House",
      "Activity Type", "Activity Date", "Duration (min)", "Points",
      "Context", "Competition Name", "Location", "Solo / Team",
      "Sport Satisfaction", "Social Sport Satisfaction",
      "Competitive Sport Satisfaction", "Club / Rep Participation",
      "Barriers", "Sports Interested In",
    ];

    const lines: string[] = [headers.map(esc).join(",")];

    for (const a of (activities || [])) {
      const u = userMap.get(a.user_id);
      const sv = surveyByUser[a.user_id] || {};

      const getSurveyAnswer = (keyword: string) => {
        const key = Object.keys(sv).find((k) => k.toLowerCase().includes(keyword));
        return key ? sv[key] : "";
      };

      const row = [
        u?.first_name || "",
        u?.last_name || "",
        u?.gender || "",
        u?.year_group || "",
        (u as any)?.house?.name || "",
        a.activity_type,
        (a.created_at || "").slice(0, 10),
        a.duration_minutes || 0,
        a.house_points_awarded || 0,
        ctxLabels[a.activity_context] || a.activity_context || "",
        a.competition_name || "",
        a.activity_location || "",
        a.participation_type === "with_others" ? "With Others" : "Solo",
        getSurveyAnswer("satisfied"),
        getSurveyAnswer("social"),
        getSurveyAnswer("competitive"),
        getSurveyAnswer("club"),
        getSurveyAnswer("stops"),
        getSurveyAnswer("interested"),
      ];
      lines.push(row.map(esc).join(","));
    }

    return lines.join("\n");
  }
}
