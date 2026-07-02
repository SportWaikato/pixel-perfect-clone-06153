import { createSupabaseServer } from "@/models/supabase/services/SupabaseServer";
import { SurveyService } from "@/models/surveys/services/SurveyService";
import { UserService } from "@/models/users/services/UserService";
import { SurveyType } from "@/models/surveys/interfaces/SurveyInterface";

export async function checkAndTriggerSurveys(userId?: string) {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    if (!userId) {
      const user = await userService.getCurrentUser();
      if (!user) {
        return { success: false, message: "User not authenticated" };
      }
      userId = user.id;
    }

    const user = await userService.getById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    await surveyService.checkAndTriggerSurveys(userId, user.created_at);

    return { success: true, message: "Survey triggers checked" };
  } catch (error) {
    console.error("Error checking survey triggers:", error);
    return { success: false, message: "Failed to check survey triggers" };
  }
}

export async function submitSurveyResponses(
  surveyId: string,
  responses: { questionId: string; answer: string | string[] | Record<string, number> }[],
) {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    const user = await userService.getCurrentUser();
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    await surveyService.submitSurvey(user.id, surveyId, responses);

    return { success: true, message: "Survey submitted successfully" };
  } catch (error) {
    console.error("Error submitting survey:", error);
    return { success: false, message: "Failed to submit survey" };
  }
}

export async function dismissSurvey(surveyType: SurveyType) {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    const user = await userService.getCurrentUser();
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    await surveyService.dismissSurvey(user.id, surveyType);

    return { success: true, message: "Survey dismissed" };
  } catch (error) {
    console.error("Error dismissing survey:", error);
    return { success: false, message: "Failed to dismiss survey" };
  }
}

export async function getPendingSurvey() {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    const user = await userService.getCurrentUser();
    if (!user) {
      return null;
    }

    await surveyService.checkAndTriggerSurveys(user.id, user.created_at);

    return surveyService.shouldShowSurvey(user.id);
  } catch (error) {
    console.error("Error getting pending survey:", error);
    return null;
  }
}

export async function triggerChallengeCompletionSurvey(userId: string) {
  try {
    const supabase = await createSupabaseServer();
    const surveyService = new SurveyService(supabase);

    await surveyService.triggerChallengeSurvey(userId);

    return { success: true, message: "Challenge survey triggered" };
  } catch (error) {
    console.error("Error triggering challenge survey:", error);
    return { success: false, message: "Failed to trigger challenge survey" };
  }
}

export async function getSurveyResultsAction(surveyId: string, schoolId?: string) {
  try {
    const supabase = await createSupabaseServer();
    const userService = new UserService(supabase);
    const surveyService = new SurveyService(supabase);

    const user = await userService.getCurrentUser();
    if (!user || (user.role !== "super_admin" && user.role !== "school_admin")) {
      return null;
    }

    return surveyService.getSurveyResults(surveyId, schoolId);
  } catch (error) {
    console.error("Error fetching survey results:", error);
    return null;
  }
}
