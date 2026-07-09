import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  UserAchievementInterface,
  AchievementInterface,
} from "@/models/achievements/interfaces/AchievementInterface";
import {
  SurveyInterface,
  UserSurveyStatusInterface,
} from "@/models/surveys/interfaces/SurveyInterface";
import { AchievementService } from "@/models/achievements/services/AchievementService";
import { UserService } from "@/models/users/services/UserService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/modules/application/components/DesignSystem/ui/tooltip";
import { RefreshCw, Award, Zap, Target } from "lucide-react";
import { m } from "framer-motion";
import StudentProgressionCard from "@/modules/dashboard/components/StudentProgressionCard";
import StudentPhotoFeed from "@/modules/dashboard/components/StudentPhotoFeed";
import PageHeader from "@/modules/application/components/Layout/PageHeader";
import SurveyPromptCard from "@/modules/surveys/components/SurveyPromptCard";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import {
  getActivityIcon,
  getActivityColor,
  getFeelingEmoji,
} from "@/modules/activities/utils/activityIcons";
import { format as formatTz, toZonedTime } from "date-fns-tz";

const NZ_TIMEZONE = "Pacific/Auckland";
import { recalculateUserTotals } from "@/modules/activities/actions/recalculateTotals";
import { checkHistoricalAchievements } from "@/modules/achievements/actions/checkHistoricalAchievements";
import { recalculateUserStreaks } from "@/modules/activities/actions/recalculateStreaks";
import { formatTimeDisplay, TIME_GOALS } from "@/models/application/constants/applicationConstants";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeImageHelper } from "@/models/achievements/helpers/BadgeImageHelper";
import { squishyTap } from "@/modules/application/components/animations/tactile";

interface DashboardContentProps {
  user: UserInterface;
  initialUserAchievements: UserAchievementInterface[];
  allAchievements: AchievementInterface[];
  initialTotalPoints: number;
  initialCurrentMonthMinutes: number;
  recentActivities: ActivityInterface[];
  photoActivities?: ActivityInterface[];
  pendingSurvey: { survey: SurveyInterface; status: UserSurveyStatusInterface } | null;
}

const DashboardContent = ({
  user,
  initialUserAchievements,
  allAchievements,
  initialTotalPoints,
  initialCurrentMonthMinutes,
  recentActivities,
  photoActivities = [],
  pendingSurvey,
}: DashboardContentProps) => {
  const router = useRouter();
  const firstName = user.first_name || "there";

  // State for greeting to avoid hydration issues
  const [greeting, setGreeting] = useState(`Kia ora, ${firstName}!`);

  // Mutable state — updated by user-triggered refresh actions
  const [userAchievements, setUserAchievements] = useState(initialUserAchievements);
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints);
  const [currentMonthMinutes] = useState(initialCurrentMonthMinutes);

  useEffect(() => {
    setGreeting(`Kia ora, ${firstName}!`);
  }, [firstName]);

  // Data is server-rendered — no loading state needed
  const achievementsLoading = false;

  // Update to use current month progress instead of lifetime total
  const monthlyGoalMinutes = user.monthly_goal_minutes || TIME_GOALS.MONTHLY_MINUTES;
  const progressPercentage = (currentMonthMinutes / monthlyGoalMinutes) * 100;

  // Use real streak data from user object
  const currentStreak = user.current_streak || 0;
  const longestStreak = user.longest_streak || 0;

  // Calculate earned count from user achievements
  const earnedCount = userAchievements.length;

  // Create a map of earned achievement IDs for quick lookup
  const earnedAchievementIds = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievement_id)),
    [userAchievements],
  );

  const handleRecalculateTotals = async () => {
    try {
      const result = await recalculateUserTotals();
      if (result.success) {
        toast.success(result.message);

        // Also refresh points data
        const supabase = createSupabaseClient();
        const userService = new UserService(supabase);
        const userPointsData = await userService.getUserPointsBreakdown(user.id);
        setTotalPoints(userPointsData.totalFinalPoints);

        router.invalidate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to recalculate totals");
    }
  };

  const handleCheckHistoricalAchievements = async () => {
    try {
      const result = await checkHistoricalAchievements();
      if (result.success) {
        toast.success(result.message);
        // Refresh achievements and points data
        const supabase = createSupabaseClient();
        const achievementService = new AchievementService(supabase);
        const userService = new UserService(supabase);
        const [userAchievementsData, userPointsData] = await Promise.all([
          achievementService.getUserAchievements(user.id),
          userService.getUserPointsBreakdown(user.id),
        ]);
        setUserAchievements(userAchievementsData);
        setTotalPoints(userPointsData.totalFinalPoints);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to check achievements");
    }
  };

  const handleRecalculateStreaks = async () => {
    try {
      const result = await recalculateUserStreaks();
      if (result.success) {
        toast.success(result.message);
        router.invalidate();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to recalculate streaks");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <PageHeader
        title={greeting}
        subtitle="Track your progress and achievements"
        actions={
          <m.div {...squishyTap}>
            <Link
              to="/activities"
              className="flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: "#D103D1" }}
            >
              <Zap size={24} className="text-white" />
              <span className="text-white text-xs font-semibold leading-tight text-center">
                Log
                <br />
                Activity
              </span>
            </Link>
          </m.div>
        }
      />

      {pendingSurvey && (
        <SurveyPromptCard
          surveyType={pendingSurvey.status.survey_type}
          surveyName={pendingSurvey.survey.name}
        />
      )}

      {user.school_id && (
        <StudentProgressionCard
          userId={user.id}
          schoolId={user.school_id}
          lifetimePoints={totalPoints}
          variant="compact"
        />
      )}

      {/* Recent Activity Trend */}
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="shadow-sm rounded-2xl border border-gray-200" style={{ backgroundColor: "#f9fefd" }}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Last 7 Days</span>
              <span className="text-xs text-gray-400">{currentMonthMinutes} min this month</span>
            </div>
            <div className="flex items-end gap-2 h-20">
              {(() => {
                const days: { label: string; mins: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const dateStr = d.toISOString().split("T")[0];
                  const dayMins = recentActivities
                    .filter((a) => a.created_at.startsWith(dateStr))
                    .reduce((s, a) => s + (a.duration_minutes || 0), 0);
                  days.push({
                    label: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
                    mins: dayMins,
                  });
                }
                const maxMins = Math.max(1, ...days.map((d) => d.mins));
                return days.map((day) => (
                  <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-500">{day.mins > 0 ? day.mins : ""}</span>
                    <m.div
                      className="w-full rounded-t-md"
                      style={{ minHeight: 4, backgroundColor: day.mins > 0 ? "#1B5E4B" : "#E5E7EB" }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(4, (day.mins / maxMins) * 100)}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                    <span className="text-[10px] text-gray-400">{day.label}</span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </m.div>

      {/* Student Photo Feed */}
      {photoActivities.length > 0 && (
        <StudentPhotoFeed
          activities={photoActivities}
          userId={user.id}
        />
      )}

      {/* Activity Snapshot */}
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card
          className="shadow-sm rounded-2xl border border-gray-200 overflow-hidden"
          style={{ backgroundColor: "#f9fefd" }}
        >
          <CardContent className="grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6">
            {[
              { value: totalPoints, label: "Total Points", sub: `${currentMonthMinutes} min this month` },
              { value: earnedCount, label: "Badges", sub: `${currentStreak} day streak` },
              { value: recentActivities.length, label: "Activities", sub: "This week" },
            ].map((tile, i) => (
              <m.div
                key={tile.label}
                className="flex flex-col items-center rounded-2xl border border-[#1B5E4B]/10 bg-[#1B5E4B]/5 py-4 px-2 text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.06, ease: "easeOut" }}
              >
                <div className="text-3xl font-black leading-none text-[#1B5E4B] sm:text-4xl">
                  {tile.value}
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-700">{tile.label}</p>
                <p className="text-[11px] text-gray-400 font-accent">{tile.sub}</p>
              </m.div>
            ))}
          </CardContent>
        </Card>
      </m.div>

      {/* Achievements and Streak Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Card - 1/3 width */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        >
          <Card
            className="h-full shadow-sm rounded-2xl border border-gray-200"
            style={{ backgroundColor: "#f9fefd" }}
          >
            <CardContent className="pt-8 pb-6 px-6 text-center relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 h-6 w-6 p-0 text-gray-400 hover:text-[#1B5E4B] hover:bg-[#1B5E4B]/10"
                onClick={handleRecalculateStreaks}
                title="Refresh streak calculation"
              >
                <RefreshCw size={14} />
              </Button>

              {/* Fire icon with radial glow */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(251,176,64,0.25) 0%, rgba(251,176,64,0.08) 60%, transparent 80%)",
                  }}
                >
                  <img src="/fire.png" alt="Streak fire" width={64} height={64} />
                </div>
              </div>

              {/* Streak number */}
              <div className="text-8xl font-black leading-none text-[#1B5E4B] mb-2 tracking-tight">
                {currentStreak}
              </div>
              <p className="text-lg text-[#1B5E4B] mb-1 font-accent text-xl">Day Streak</p>
              <p className="text-sm text-gray-400 mb-6">
                Best Streak: {longestStreak} days in a row
              </p>

              {/* Next Milestone box */}
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                <p className="text-sm text-[#1B5E4B] mb-3 font-accent text-lg">Next Milestone</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentStreak % 7) / 7) * 100}%`,
                      backgroundColor: "#F6A623",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {7 - (currentStreak % 7)} days to Week Warrior badge
                </p>
              </div>
            </CardContent>
          </Card>
        </m.div>

        {/* Achievements - 2/3 width */}
        <m.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
        >
          <Card
            className="h-full shadow-sm rounded-2xl border border-gray-200"
            style={{ backgroundColor: "#f9fefd" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black text-[#1B5E4B]">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements
                <Badge
                  variant="secondary"
                  className="bg-[#1B5E4B]/10 text-[#1B5E4B] border-[#1B5E4B]/20"
                >
                  {earnedCount}/{allAchievements.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-[#1B5E4B] hover:bg-[#1B5E4B]/10"
                  onClick={handleCheckHistoricalAchievements}
                  title="Check for achievements you may have earned"
                >
                  <RefreshCw size={14} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="w-full aspect-square bg-gray-200 rounded-2xl" />
                        <div className="h-3 w-full bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {allAchievements.length > 0 ? (
                    <TooltipProvider>
                      <div className="max-h-[22rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 pr-2">
                          {allAchievements.map((achievement: AchievementInterface) => {
                            const isEarned = earnedAchievementIds.has(achievement.id);
                            const userAchievement = userAchievements.find(
                              (ua) => ua.achievement_id === achievement.id,
                            );

                            return (
                              <Tooltip key={achievement.id}>
                                <TooltipTrigger asChild>
                                  <m.div
                                    className={`p-2 rounded-2xl border transition-all duration-150 cursor-pointer ${
                                      isEarned
                                        ? "bg-white border-gray-200 shadow-sm"
                                        : "bg-gray-100 border-gray-200 opacity-60"
                                    }`}
                                    whileHover={{ scale: 1.06, y: -2 }}
                                  >
                                    <div className="text-center">
                                      {BadgeImageHelper.hasBadgeImage(achievement) ? (
                                        <div className="w-32 h-32 mx-auto mb-2 relative overflow-hidden rounded-xl">
                                          <img
                                            src={BadgeImageHelper.getBadgeImageUrl(achievement)}
                                            alt={achievement.name}
                                            sizes="128px"
                                            className={`object-contain ${isEarned ? "" : "grayscale opacity-60"}`}
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          className={`w-32 h-32 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                                            isEarned
                                              ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                                              : "bg-gray-200 text-gray-400"
                                          }`}
                                        >
                                          <Award className="w-16 h-16" />
                                        </div>
                                      )}
                                      <div
                                        className={`text-xs sm:text-sm font-medium ${isEarned ? "text-gray-800" : "text-gray-500"}`}
                                      >
                                        {achievement.name}
                                      </div>
                                      {isEarned && userAchievement && (
                                        <Badge
                                          variant="secondary"
                                          className="mt-2 text-xs bg-green-100 text-green-700 border-green-200"
                                        >
                                          Earned
                                        </Badge>
                                      )}
                                    </div>
                                  </m.div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-center">
                                    <div className="font-semibold text-sm mb-1">
                                      {achievement.name}
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      {achievement.description}
                                    </div>
                                    {isEarned && userAchievement && (
                                      <div className="text-xs text-green-400 mt-1 font-medium">
                                        ✓ Earned{" "}
                                        {new Date(userAchievement.earned_at).toLocaleDateString()}
                                      </div>
                                    )}
                                    {!isEarned && (
                                      <div className="text-xs text-gray-300 mt-1">
                                        Not yet earned
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </TooltipProvider>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 font-accent text-lg">
                        No achievements available yet.
                      </div>
                      <div className="text-gray-400 text-sm mt-2">
                        New achievement challenges coming soon!
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </m.div>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
        >
          <Card className="shadow-sm rounded-2xl border border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg text-gray-800 font-accent text-xl">
                Recent Activities
              </CardTitle>
              <Link to="/activities" className="text-sm text-[#1B5E4B] font-medium hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.map((activity, i) => {
                const actType = activity.activity_type;
                const color = getActivityColor(actType);
                const displayName =
                  actType === "something_else" && activity.custom_activity_name
                    ? activity.custom_activity_name
                    : (activity.activity_type as string).replace(/_/g, " ");
                return (
                  <m.div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {getActivityIcon(actType, 30)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 capitalize truncate">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {activity.duration_minutes} min · {getFeelingEmoji(activity.feeling)} ·{" "}
                        {formatTz(
                          toZonedTime(new Date(activity.created_at), NZ_TIMEZONE),
                          "MMM d",
                          {
                            timeZone: NZ_TIMEZONE,
                          },
                        )}
                      </p>
                    </div>
                    <div className="text-sm font-bold shrink-0" style={{ color: "#19AA4B" }}>
                      +{activity.final_points || activity.house_points_awarded}
                    </div>
                  </m.div>
                );
              })}
            </CardContent>
          </Card>
        </m.div>
      )}
    </div>
  );
};

export default DashboardContent;
