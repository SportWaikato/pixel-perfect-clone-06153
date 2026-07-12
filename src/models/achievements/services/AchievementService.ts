import { SupabaseClient } from "@supabase/supabase-js";
import {
  AchievementInterface,
  UserAchievementInterface,
  HouseAchievementInterface,
  HouseChallengeResult,
} from "../interfaces/AchievementInterface";
import { StorageService } from "@/models/storage/services/StorageService";
import { activityTypesMatch, filterActivitiesByType } from "../constants/activityTypeAliases";

const ACHIEVEMENTS_TABLE = "achievements";
const USER_ACHIEVEMENTS_TABLE = "user_achievements";

export class AchievementService {
  private supabaseClient: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }

  private async getAuthenticatedUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await this.supabaseClient.auth.getUser();
    if (error || !user) return null;
    return user.id;
  }

  async checkAndAwardAchievements(
    userId: string,
    activityData: {
      activity_type: string;
      duration_minutes: number;
      participation_type: string;
      created_at: string;
      event_id?: string;
    },
  ): Promise<UserAchievementInterface[]> {
    const authUserId = await this.getAuthenticatedUserId();
    if (!authUserId || authUserId !== userId) {
      console.error("Security: userId does not match authenticated user");
      return [];
    }

    const newAchievements: UserAchievementInterface[] = [];

    const [achievementsResult, userAchievementsResult] = await Promise.all([
      this.supabaseClient.from(ACHIEVEMENTS_TABLE).select("id, criteria").eq("is_active", true),
      this.supabaseClient
        .from(USER_ACHIEVEMENTS_TABLE)
        .select("achievement_id")
        .eq("user_id", userId),
    ]);

    if (achievementsResult.error) {
      console.error("Error fetching achievements:", achievementsResult.error);
      return [];
    }
    if (!achievementsResult.data) return [];

    if (userAchievementsResult.error) {
      console.error("Error fetching user achievements:", userAchievementsResult.error);
      return [];
    }

    const achievements = achievementsResult.data;
    const earnedAchievementIds = userAchievementsResult.data?.map((ua) => ua.achievement_id) ?? [];

    // Check for event-based achievements first
    if (activityData.event_id) {
      const { data: eventWithBadge, error: eventError } = await this.supabaseClient
        .from("events")
        .select(
          `
          *,
          badge:achievements(*)
        `,
        )
        .eq("id", activityData.event_id)
        .eq("is_active", true)
        .single();

      if (
        !eventError &&
        eventWithBadge?.badge &&
        !earnedAchievementIds.includes(eventWithBadge.badge.id)
      ) {
        const achievement = eventWithBadge.badge;
        const criteria = achievement.criteria;

        // Fetch all user activities for this event once, then filter in memory per criteria type
        const { data: userEventActivities, error: eventActivitiesError } = await this.supabaseClient
          .from("activities")
          .select("duration_minutes, activity_type, participation_type")
          .eq("user_id", userId)
          .eq("event_id", activityData.event_id);

        const eventActivities =
          !eventActivitiesError && userEventActivities ? userEventActivities : [];

        let shouldAward = false;

        if (criteria.type === "time_in_nature" || criteria.type === "specific_activity") {
          const totalMinutes = eventActivities.reduce(
            (sum, activity) => sum + (activity.duration_minutes || 0),
            0,
          );
          shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
        } else if (criteria.type === "social_activity") {
          if (activityData.participation_type === criteria.participation_type) {
            const socialActivities = eventActivities.filter(
              (a) => a.participation_type === criteria.participation_type,
            );
            const totalMinutes = socialActivities.reduce(
              (sum, activity) => sum + (activity.duration_minutes || 0),
              0,
            );
            shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
          }
        } else if (criteria.type === "walk_and_talk") {
          const matchesWalkingType = activityTypesMatch(
            activityData.activity_type,
            criteria.activity_type || "walking",
          );

          if (
            matchesWalkingType &&
            activityData.participation_type === criteria.participation_type
          ) {
            const matchingActivities = filterActivitiesByType(
              eventActivities.filter((a) => a.participation_type === criteria.participation_type),
              criteria.activity_type || "walking",
            );
            const totalMinutes = matchingActivities.reduce(
              (sum, activity) => sum + (activity.duration_minutes || 0),
              0,
            );
            shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
          }
        }

        if (shouldAward) {
          const { data: newAchievement, error: insertError } = await this.supabaseClient
            .from(USER_ACHIEVEMENTS_TABLE)
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
            })
            .select(
              `
              *,
              achievement:achievements(*)
            `,
            )
            .single();

          if (!insertError && newAchievement) {
            newAchievements.push(newAchievement);
          } else if (insertError) {
            console.error("Error inserting event-based achievement:", insertError);
          }
        }
      }
    }

    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement.id)) continue;

      const criteria = achievement.criteria;
      if (!criteria || typeof criteria !== "object") continue;

      const activityDate = new Date(activityData.created_at);

      // Check date range if specified
      if (criteria.date_range) {
        const startDate = new Date(criteria.date_range.start);
        const endDate = new Date(criteria.date_range.end);
        if (activityDate < startDate || activityDate > endDate) continue;
      }

      let shouldAward = false;

      // Check specific criteria
      switch (criteria.type) {
        case "time_in_nature": {
          const natureActivityTypes = [
            "walking",
            "running",
            "walk_hike",
            "hunting_diving",
            "run_jog",
            "solo_sport",
            "cycling",
            "bike_cycle",
          ];
          shouldAward =
            natureActivityTypes.includes(activityData.activity_type) &&
            activityData.duration_minutes >= criteria.duration_minutes;
          break;
        }

        case "specific_activity":
          if (criteria.activity_type) {
            shouldAward =
              activityTypesMatch(activityData.activity_type, criteria.activity_type) &&
              (criteria.duration_minutes
                ? activityData.duration_minutes >= criteria.duration_minutes
                : true);
          } else {
            shouldAward = activityData.activity_type === criteria.activity_type;
          }
          break;

        case "social_activity":
          shouldAward =
            activityData.participation_type === criteria.participation_type &&
            activityData.duration_minutes >= criteria.duration_minutes;
          break;

        case "walk_and_talk": {
          const matchesWalkingType = activityTypesMatch(
            activityData.activity_type,
            criteria.activity_type || "walking",
          );

          shouldAward =
            matchesWalkingType &&
            activityData.participation_type === criteria.participation_type &&
            activityData.duration_minutes >= criteria.duration_minutes;
          break;
        }

        // Note: The following criteria types require checking user's historical data
        // They can't be evaluated from a single activity and would need separate methods
        case "entry_count":
        case "total_time":
        case "streak":
        case "activity_variety":
        case "first_challenge":
        case "leaderboard_entry":
          // These will be checked separately via batch processes or other triggers
          // For now, skip in real-time checking
          shouldAward = false;
          break;
      }

      if (shouldAward) {
        const { data: newAchievement, error: insertError } = await this.supabaseClient
          .from(USER_ACHIEVEMENTS_TABLE)
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          })
          .select(
            `
            *,
            achievement:achievements(*)
          `,
          )
          .single();

        if (!insertError && newAchievement) {
          newAchievements.push(newAchievement);
        } else if (insertError) {
          console.error("Error inserting user achievement:", insertError);
        }
      }
    }

    return newAchievements;
  }

  async getUserAchievements(userId: string): Promise<UserAchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(USER_ACHIEVEMENTS_TABLE)
      .select(
        `
        *,
        achievement:achievements(*)
      `,
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching user achievements:", error);
      return [];
    }

    return data || [];
  }

  async getAllAchievements(): Promise<AchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching all achievements:", error);
      return [];
    }

    return data || [];
  }

  async getAchievementById(id: string): Promise<AchievementInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Error fetching achievement by id:", error);
      return null;
    }

    return data;
  }

  async checkHistoricalAchievements(userId: string): Promise<UserAchievementInterface[]> {
    const authUserId = await this.getAuthenticatedUserId();
    if (!authUserId || authUserId !== userId) {
      console.error("Security: userId does not match authenticated user");
      return [];
    }

    const newAchievements: UserAchievementInterface[] = [];

    // Fetch all required data in parallel — none of these depend on each other
    const [allAchievementsResult, userAchievementsResult, userDataResult, userActivitiesResult] =
      await Promise.all([
        this.supabaseClient.from(ACHIEVEMENTS_TABLE).select("id, criteria").eq("is_active", true),
        this.supabaseClient
          .from(USER_ACHIEVEMENTS_TABLE)
          .select("achievement_id")
          .eq("user_id", userId),
        this.supabaseClient
          .from("users")
          .select("total_minutes, current_streak, longest_streak, total_points")
          .eq("id", userId)
          .single(),
        this.supabaseClient
          .from("activities")
          .select("activity_type, duration_minutes, event_id")
          .eq("user_id", userId),
      ]);

    if (allAchievementsResult.error) {
      console.error("Error fetching achievements:", allAchievementsResult.error);
      return [];
    }
    if (!allAchievementsResult.data) return [];

    if (userAchievementsResult.error) {
      console.error("Error fetching user achievements:", userAchievementsResult.error);
      return [];
    }

    if (userDataResult.error) {
      console.error("Error fetching user data:", userDataResult.error);
      return [];
    }

    if (userActivitiesResult.error) {
      console.error("Error fetching user activities:", userActivitiesResult.error);
      return [];
    }

    const checkableTypes = [
      "entry_count",
      "total_time",
      "streak",
      "activity_variety",
      "first_challenge",
      "leaderboard_entry",
      "specific_activity",
    ];
    const achievements = allAchievementsResult.data.filter(
      (achievement) =>
        achievement.criteria &&
        typeof achievement.criteria === "object" &&
        "type" in achievement.criteria &&
        checkableTypes.includes(achievement.criteria.type),
    );

    const earnedAchievementIds = userAchievementsResult.data?.map((ua) => ua.achievement_id) ?? [];
    const userData = userDataResult.data;
    const userActivities = userActivitiesResult.data ?? [];

    // Count unique activity types for variety check
    const uniqueActivityTypes = new Set(userActivities.map((a) => a.activity_type));
    const activityCount = userActivities.length;

    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement.id)) continue;

      const criteria = achievement.criteria;
      let shouldAward = false;

      switch (criteria.type) {
        case "entry_count":
          shouldAward = (activityCount || 0) >= criteria.count;
          break;

        case "total_time":
          shouldAward = (userData.total_minutes || 0) >= criteria.minutes;
          break;

        case "streak": {
          const requiredDays = criteria.days;
          shouldAward = (userData.longest_streak || 0) >= requiredDays;
          break;
        }

        case "activity_variety":
          // Implementation: Count unique activity types
          shouldAward = uniqueActivityTypes.size >= (criteria.count || 5);
          break;

        case "specific_activity":
          // Check if user has done this specific activity type
          if (criteria.activity_type) {
            const hasActivityType = userActivities?.some((activity) =>
              activityTypesMatch(activity.activity_type, criteria.activity_type),
            );

            if (hasActivityType) {
              // If there's a duration requirement, check cumulative duration
              if (criteria.duration_minutes) {
                const matchingActivities = userActivities.filter((activity) =>
                  activityTypesMatch(activity.activity_type, criteria.activity_type),
                );
                const totalMinutes = matchingActivities.reduce(
                  (sum, a) => sum + (a.duration_minutes || 0),
                  0,
                );
                shouldAward = totalMinutes >= criteria.duration_minutes;
              } else {
                // No duration requirement, just need to have done it once
                shouldAward = true;
              }
            }
          }
          break;

        case "first_challenge":
          // Check if user has participated in any events (using already-fetched activities)
          shouldAward = (userActivities || []).some((a) => a.event_id !== null);
          break;

        case "leaderboard_entry":
          // Check if user has any points to be on leaderboard
          shouldAward = (userData.total_points || 0) > 0;
          break;
      }

      if (shouldAward) {
        const { data: newAchievement, error: insertError } = await this.supabaseClient
          .from(USER_ACHIEVEMENTS_TABLE)
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
          })
          .select(
            `
            *,
            achievement:achievements(*)
          `,
          )
          .single();

        if (!insertError && newAchievement) {
          newAchievements.push(newAchievement);
        } else if (insertError) {
          console.error("Error inserting historical achievement:", insertError);
        }
      }
    }

    return newAchievements;
  }

  async checkEventBasedAchievements(userId: string): Promise<UserAchievementInterface[]> {
    const authUserId = await this.getAuthenticatedUserId();
    if (!authUserId || authUserId !== userId) {
      console.error("Security: userId does not match authenticated user");
      return [];
    }

    const newAchievements: UserAchievementInterface[] = [];

    // Get user's existing achievements
    const { data: userAchievements, error: userAchievementsError } = await this.supabaseClient
      .from(USER_ACHIEVEMENTS_TABLE)
      .select("achievement_id")
      .eq("user_id", userId);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return [];
    }

    const earnedAchievementIds = userAchievements?.map((ua) => ua.achievement_id) || [];

    // Get all user activities with events that have badges
    const { data: userActivitiesWithEvents, error: activitiesError } = (await this.supabaseClient
      .from("activities")
      .select(
        `
        event_id, duration_minutes, activity_type, participation_type,
        event:events(
          id,
          badge:achievements(id, criteria)
        )
      `,
      )
      .eq("user_id", userId)
      .not("event_id", "is", null)) as { data: any[] | null; error: any };

    if (activitiesError) {
      console.error("Error fetching user activities with events:", activitiesError);
      return [];
    }

    // Group activities by event
    const activitiesByEvent = new Map();
    for (const activity of userActivitiesWithEvents || []) {
      if (activity.event?.badge) {
        const eventId = activity.event_id;
        if (!activitiesByEvent.has(eventId)) {
          activitiesByEvent.set(eventId, {
            event: activity.event,
            badge: activity.event.badge,
            activities: [],
          });
        }
        activitiesByEvent.get(eventId).activities.push(activity);
      }
    }

    // Check each event for achievement eligibility
    for (const [, eventData] of activitiesByEvent) {
      const { badge, activities } = eventData;

      // Skip if already earned
      if (earnedAchievementIds.includes(badge.id)) continue;

      const criteria = badge.criteria;
      let shouldAward = false;

      if (criteria.type === "time_in_nature" || criteria.type === "specific_activity") {
        // For specific_activity, filter by matching activity types using alias system
        let relevantActivities = activities;

        if (criteria.type === "specific_activity" && criteria.activity_type) {
          relevantActivities = filterActivitiesByType(activities, criteria.activity_type);
        }

        const totalMinutes = relevantActivities.reduce(
          (sum: number, activity: any) => sum + (activity.duration_minutes || 0),
          0,
        );
        shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
      } else if (criteria.type === "social_activity") {
        const socialActivities = activities.filter(
          (activity: any) => activity.participation_type === criteria.participation_type,
        );
        const totalMinutes = socialActivities.reduce(
          (sum: number, activity: any) => sum + (activity.duration_minutes || 0),
          0,
        );
        shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
      } else if (criteria.type === "walk_and_talk") {
        // Use centralized alias system for walk_and_talk achievements
        const matchingActivities = activities.filter((activity: any) => {
          const activityMatches = activityTypesMatch(
            activity.activity_type,
            criteria.activity_type || "walking",
          );
          return activityMatches && activity.participation_type === criteria.participation_type;
        });
        const totalMinutes = matchingActivities.reduce(
          (sum: number, activity: any) => sum + (activity.duration_minutes || 0),
          0,
        );
        shouldAward = totalMinutes >= (criteria.duration_minutes || 0);
      }

      if (shouldAward) {
        const { data: newAchievement, error: insertError } = await this.supabaseClient
          .from(USER_ACHIEVEMENTS_TABLE)
          .insert({
            user_id: userId,
            achievement_id: badge.id,
          })
          .select(
            `
            *,
            achievement:achievements(*)
          `,
          )
          .single();

        if (!insertError && newAchievement) {
          newAchievements.push(newAchievement);
        } else if (insertError) {
          console.error("Error inserting event-based achievement:", insertError);
        }
      }
    }

    return newAchievements;
  }

  // CRUD operations for badge management

  async getAll(): Promise<AchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<AchievementInterface | null> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(error.message);
    }
    return data;
  }

  async create(achievementData: Partial<AchievementInterface>): Promise<AchievementInterface> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .insert({
        ...achievementData,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(
    id: string,
    achievementData: Partial<AchievementInterface>,
  ): Promise<AchievementInterface> {
    const { data, error } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .update({
        ...achievementData,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient.from(ACHIEVEMENTS_TABLE).delete().eq("id", id);

    if (error) throw new Error(error.message);
  }

  async createWithImage(
    achievementData: Partial<AchievementInterface>,
    imageFile?: File,
  ): Promise<AchievementInterface> {
    let finalAchievementData = { ...achievementData };

    if (imageFile) {
      const storageService = new StorageService(this.supabaseClient);
      const { storage_url, storage_path } = await storageService.uploadBadgeImage(imageFile);

      finalAchievementData = {
        ...finalAchievementData,
        storage_url,
        storage_path,
        is_custom_upload: true,
        image_filename: undefined, // Clear legacy field
      };
    }

    return await this.create(finalAchievementData);
  }

  async updateWithImage(
    id: string,
    achievementData: Partial<AchievementInterface>,
    imageFile?: File,
  ): Promise<AchievementInterface> {
    let finalAchievementData = { ...achievementData };

    if (imageFile) {
      // Get current achievement to find old storage path
      const currentAchievement = await this.getById(id);
      const oldStoragePath = currentAchievement?.storage_path || null;

      const storageService = new StorageService(this.supabaseClient);
      const { storage_url, storage_path } = await storageService.updateBadgeImage(
        oldStoragePath,
        imageFile,
      );

      finalAchievementData = {
        ...finalAchievementData,
        storage_url,
        storage_path,
        is_custom_upload: true,
        image_filename: undefined, // Clear legacy field
      };
    }

    return await this.update(id, finalAchievementData);
  }

  async deleteWithCleanup(id: string): Promise<void> {
    const achievement = await this.getById(id);

    if (achievement?.storage_path) {
      try {
        const storageService = new StorageService(this.supabaseClient);
        await storageService.deleteBadgeImage(achievement.storage_path);
      } catch (error) {
        console.warn("Failed to delete badge image from storage:", error);
      }
    }

    await this.delete(id);
  }

  async getHouseBadgesForSchool(schoolId: string): Promise<HouseAchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from("house_achievements")
      .select("*")
      .eq("school_id", schoolId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching house badges for school:", error);
      return [];
    }

    return (data || []) as HouseAchievementInterface[];
  }

  async getHouseBadgesForTerm(
    schoolId: string,
    termId: string,
  ): Promise<HouseAchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from("house_achievements")
      .select("*")
      .eq("school_id", schoolId)
      .eq("term_id", termId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching house badges for term:", error);
      return [];
    }

    return (data || []) as HouseAchievementInterface[];
  }

  async getHouseBadges(houseId: string): Promise<HouseAchievementInterface[]> {
    const { data, error } = await this.supabaseClient
      .from("house_achievements")
      .select("*")
      .eq("house_id", houseId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Error fetching house badges:", error);
      return [];
    }

    return (data || []) as HouseAchievementInterface[];
  }

  async evaluateHouseChallenges(schoolId: string): Promise<HouseChallengeResult[]> {
    const { data: achievements } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .eq("is_active", true)
      .eq("scope", "house");

    if (!achievements || achievements.length === 0) return [];

    const results: HouseChallengeResult[] = [];

    for (const achievement of achievements) {
      const criteria = achievement.criteria as Record<string, unknown> | null;
      if (!criteria) continue;

      const metric = criteria.metric as string | undefined;
      const awardConfig = criteria.award_config as Record<string, unknown> | undefined;
      if (!metric || !awardConfig) continue;

      const challengeResults = await this.calculateHouseMetric(schoolId, metric, awardConfig);

      const awardTop = typeof awardConfig.award_top_n === "number" ? awardConfig.award_top_n : 1;

      for (const result of challengeResults) {
        if (result.rank <= awardTop) {
          result.is_winner = true;
          result.awarded_points = achievement.points_reward;
          results.push(result);

          const { data: existing } = await this.supabaseClient
            .from("house_achievements")
            .select("id")
            .eq("achievement_id", achievement.id)
            .eq("school_id", schoolId)
            .single();

          if (!existing) {
            const houseRecord = challengeResults.find((h) => h.house_id === result.house_id);
            await this.supabaseClient.from("house_achievements").insert({
              achievement_id: achievement.id,
              house_id: result.house_id,
              school_id: schoolId,
              term_id: null,
              achievement_name: achievement.name,
              achievement_description: achievement.description || "",
              icon_name: achievement.icon_name,
              image_filename: achievement.image_filename || null,
              storage_url: achievement.storage_url || null,
              criteria: achievement.criteria,
              points_reward: result.awarded_points,
              house_name: houseRecord?.house_name || "",
              house_color: houseRecord?.house_color || "",
            });
          }
        }
      }
    }

    return results;
  }

  async getHouseChallengeResults(
    schoolId: string,
  ): Promise<Record<string, HouseChallengeResult[]>> {
    const { data: achievements } = await this.supabaseClient
      .from(ACHIEVEMENTS_TABLE)
      .select("*")
      .eq("is_active", true)
      .eq("scope", "house");

    if (!achievements || achievements.length === 0) return {};

    const resultMap: Record<string, HouseChallengeResult[]> = {};

    for (const achievement of achievements) {
      const criteria = achievement.criteria as Record<string, unknown> | null;
      if (!criteria) continue;

      const metric = criteria.metric as string | undefined;
      const awardConfig = criteria.award_config as Record<string, unknown> | undefined;
      if (!metric || !awardConfig) continue;

      resultMap[achievement.id] = await this.calculateHouseMetric(schoolId, metric, awardConfig);
    }

    return resultMap;
  }

  async calculateHouseMetric(
    schoolId: string,
    metric: string,
    awardConfig: Record<string, unknown>,
  ): Promise<HouseChallengeResult[]> {
    const { data: houses } = await this.supabaseClient
      .from("houses")
      .select("id, name, color")
      .eq("school_id", schoolId);

    if (!houses || houses.length === 0) return [];

    const winnerRule = (awardConfig.winner_rule as string) || "highest_total";
    const activeDef = awardConfig.active_definition as Record<string, unknown> | undefined;
    const minActiveMinutes =
      typeof activeDef?.min_total_minutes === "number" ? activeDef.min_total_minutes : 30;
    const minStreakMinutes =
      typeof awardConfig.min_minutes_per_streak_day === "number"
        ? awardConfig.min_minutes_per_streak_day
        : 1;

    const { data: houseUsersAll } = await this.supabaseClient
      .from("users")
      .select("id, house_id, current_streak, longest_streak")
      .eq("school_id", schoolId)
      .eq("is_deleted", false)
      .not("house_id", "is", null);

    if (!houseUsersAll) return [];

    const houseUserMap = new Map<string, string[]>();
    const houseStreaks = new Map<string, number[]>();

    for (const u of houseUsersAll) {
      const hid = u.house_id as string;
      const ids = houseUserMap.get(hid) || [];
      ids.push(u.id);
      houseUserMap.set(hid, ids);

      const streaks = houseStreaks.get(hid) || [];
      streaks.push(u.current_streak || 0);
      houseStreaks.set(hid, streaks);
    }

    const activeStart = new Date();
    activeStart.setMonth(activeStart.getMonth() - 3);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const results: HouseChallengeResult[] = [];

    for (const house of houses) {
      const memberIds = houseUserMap.get(house.id) || [];
      const totalMembers = memberIds.length;
      let score = 0;

      switch (metric) {
        case "total_minutes": {
          const { data: actData } = await this.supabaseClient
            .from("activities")
            .select("duration_minutes")
            .in("user_id", memberIds)
            .eq("is_rejected", false)
            .gte("created_at", activeStart.toISOString());
          score = (actData || []).reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
          break;
        }
        case "average_minutes_per_student": {
          if (totalMembers === 0) {
            score = 0;
            break;
          }
          const { data: actData } = await this.supabaseClient
            .from("activities")
            .select("duration_minutes")
            .in("user_id", memberIds)
            .eq("is_rejected", false)
            .gte("created_at", activeStart.toISOString());
          const total = (actData || []).reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
          score = total / totalMembers;
          break;
        }
        case "participation_rate": {
          if (totalMembers === 0) {
            score = 0;
            break;
          }
          const { count: activeCount } = await this.supabaseClient
            .from("users")
            .select("id", { count: "exact", head: true })
            .in("id", memberIds)
            .eq("is_deleted", false)
            .gte("total_minutes", minActiveMinutes);
          score = ((activeCount || 0) / totalMembers) * 100;
          break;
        }
        case "average_streak": {
          const houseStreakList = houseStreaks.get(house.id) || [];
          score =
            houseStreakList.length > 0
              ? houseStreakList.reduce((s, v) => s + v, 0) / houseStreakList.length
              : 0;
          break;
        }
        case "challenge_completions": {
          if (memberIds.length === 0) {
            score = 0;
            break;
          }
          const { data: eventActs } = await this.supabaseClient
            .from("activities")
            .select("event_id")
            .in("user_id", memberIds)
            .not("event_id", "is", null)
            .eq("is_rejected", false)
            .gte("created_at", activeStart.toISOString());
          const uniqueEvents = new Set((eventActs || []).map((a) => a.event_id).filter(Boolean));
          score = uniqueEvents.size;
          break;
        }
        case "challenge_completion_rate": {
          if (totalMembers === 0) {
            score = 0;
            break;
          }
          const { data: eventActs } = await this.supabaseClient
            .from("activities")
            .select("event_id, user_id")
            .in("user_id", memberIds)
            .not("event_id", "is", null)
            .eq("is_rejected", false)
            .gte("created_at", activeStart.toISOString());
          const usersWhoCompleted = new Set((eventActs || []).map((a) => a.user_id));
          score = (usersWhoCompleted.size / totalMembers) * 100;
          break;
        }
        case "unique_active_students": {
          const { data: activeUsers } = await this.supabaseClient
            .from("activities")
            .select("user_id")
            .in("user_id", memberIds)
            .eq("is_rejected", false)
            .gte("created_at", activeStart.toISOString());
          const uniqueUsers = new Set((activeUsers || []).map((a) => a.user_id));
          score = uniqueUsers.size;
          break;
        }
        case "weekly_growth": {
          // Reward the house that grew its movement the most: this week's total
          // minutes compared with the previous week's.
          if (memberIds.length === 0) {
            score = 0;
            break;
          }
          const { data: recentActs } = await this.supabaseClient
            .from("activities")
            .select("duration_minutes, created_at")
            .in("user_id", memberIds)
            .eq("is_rejected", false)
            .gte("created_at", twoWeeksAgo.toISOString());

          let thisWeekMinutes = 0;
          let lastWeekMinutes = 0;
          for (const act of recentActs || []) {
            const when = new Date(act.created_at as string);
            if (when >= oneWeekAgo) {
              thisWeekMinutes += act.duration_minutes || 0;
            } else {
              lastWeekMinutes += act.duration_minutes || 0;
            }
          }
          // Percentage growth so houses of different sizes compete fairly. When
          // there was no activity last week, treat any new movement as growth.
          score =
            lastWeekMinutes > 0
              ? ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
              : thisWeekMinutes;
          break;
        }
        default:
          score = 0;
      }

      results.push({
        house_id: house.id,
        house_name: house.name,
        house_color: house.color,
        score,
        rank: 0,
        is_winner: false,
        awarded_points: 0,
      });
    }

    const isAscending = false;

    results.sort((a, b) => (isAscending ? a.score - b.score : b.score - a.score));

    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }
}
