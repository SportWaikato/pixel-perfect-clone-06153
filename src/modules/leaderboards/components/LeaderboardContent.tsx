import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import {
  SchoolLeaderboardEntry,
  HouseLeaderboardEntry,
  UserRankingSummary,
  IndividualLeaderboardEntry,
} from "@/models/leaderboards/interfaces/LeaderboardInterface";
import { LeaderboardService } from "@/models/leaderboards/services/LeaderboardService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Progress } from "@/modules/application/components/DesignSystem/ui/progress";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/application/components/DesignSystem/ui/tabs";
import { Trophy, Crown, Award, Info, RefreshCw, Loader2 } from "lucide-react";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { formatTimeDisplay } from "@/models/application/constants/applicationConstants";
import { m } from "framer-motion";
import { squishyTap, cardSpring } from "@/modules/application/components/animations/tactile";

interface LeaderboardContentProps {
  user: UserInterface;
  initialRankings?: UserRankingSummary | null;
  initialSchoolLeaderboard?: SchoolLeaderboardEntry[];
  initialHouseLeaderboard?: HouseLeaderboardEntry[];
  initialOverallLeaderboard?: IndividualLeaderboardEntry[];
}

const LeaderboardContent = ({
  user,
  initialRankings = null,
  initialSchoolLeaderboard = [],
  initialHouseLeaderboard = [],
  initialOverallLeaderboard = [],
}: LeaderboardContentProps) => {
  const [userRankings, setUserRankings] = useState(initialRankings);
  const [schoolLeaderboard, setSchoolLeaderboard] = useState(initialSchoolLeaderboard);
  const [houseLeaderboard, setHouseLeaderboard] = useState(initialHouseLeaderboard);
  const [overallLeaderboard, setOverallLeaderboard] = useState(initialOverallLeaderboard);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const leaderboardService = useMemo(() => new LeaderboardService(createSupabaseClient()), []);

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      const [rankings, schools, houses, overall] = await Promise.all([
        leaderboardService.getUserRankings(user.id),
        leaderboardService.getSchoolLeaderboard(user.school_id),
        user.school_id
          ? leaderboardService.getHouseLeaderboard(user.school_id)
          : Promise.resolve([]),
        leaderboardService.getOverallLeaderboard({ limit: 100 }),
      ]);

      setUserRankings(rankings);
      setSchoolLeaderboard(schools);
      setHouseLeaderboard(houses);
      setOverallLeaderboard(overall);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setLoading(false);
    }
  };

  const getRankingEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getMotivationalMessage = (rank: number | null, total: number) => {
    if (!rank) return "Keep going! Log more activities to see your ranking.";
    if (rank <= 3) return `Amazing! You're in the top 3! 🎉`;
    if (total > 10 && rank <= 10) return `Great job! You're in the top 10! 💪`;
    if (rank <= total * 0.25) return `You're in the top 25%! Keep it up! 🚀`;
    if (rank <= total * 0.5) return `You're in the top half! Push for more! 📈`;
    return `Every step counts! Keep climbing! 🏃‍♂️`;
  };

  const PersonalDashboard = () => (
    <m.div className="space-y-8" {...cardSpring}>
      {/* Personal Rankings Summary */}
      <Card
        className="shadow-sm rounded-2xl border border-gray-200"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1B5E4B]">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* School Ranking */}
            <m.div
              className="text-center p-5 sm:p-6 bg-[#1B5E4B]/5 border border-gray-200 rounded-2xl"
              whileHover={{ y: -4, boxShadow: "0 8px 20px -6px rgba(0,0,0,0.1)" }}
            >
              <div className="text-5xl sm:text-6xl font-black text-[#1B5E4B] mb-1">
                {userRankings?.school_rank != null
                  ? getRankingEmoji(userRankings.school_rank)
                  : "?"}
              </div>
              <div className="text-sm text-gray-600 font-accent">in your school</div>
              <div className="text-xs text-gray-400 mt-1">{user.school?.name}</div>
            </m.div>

            {/* House Ranking */}
            <m.div
              className="text-center p-5 sm:p-6 bg-[#1B5E4B]/5 border border-gray-200 rounded-2xl"
              whileHover={{ y: -4, boxShadow: "0 8px 20px -6px rgba(0,0,0,0.1)" }}
            >
              <div className="text-5xl sm:text-6xl font-black text-[#1B5E4B] mb-1">
                {userRankings?.house_rank != null ? getRankingEmoji(userRankings.house_rank) : "?"}
              </div>
              <div className="text-sm text-gray-600 font-accent">in your house</div>
              <div className="text-xs text-gray-400 mt-1">{user.house?.name || "—"}</div>
            </m.div>

            {/* Year Group Ranking */}
            <m.div
              className="text-center p-5 sm:p-6 bg-[#1B5E4B]/5 border border-gray-200 rounded-2xl"
              whileHover={{ y: -4, boxShadow: "0 8px 20px -6px rgba(0,0,0,0.1)" }}
            >
              <div className="text-5xl sm:text-6xl font-black text-[#1B5E4B] mb-1">
                {userRankings?.year_group_rank != null
                  ? getRankingEmoji(userRankings.year_group_rank)
                  : "?"}
              </div>
              <div className="text-sm text-gray-600 font-accent">in your year</div>
              <div className="text-xs text-gray-400 mt-1">{user.year_group ?? "—"}</div>
            </m.div>

            {/* Overall Ranking */}
            <m.div
              className="text-center p-5 sm:p-6 bg-[#1B5E4B]/5 border border-gray-200 rounded-2xl"
              whileHover={{ y: -4, boxShadow: "0 8px 20px -6px rgba(0,0,0,0.1)" }}
            >
              <div className="text-5xl sm:text-6xl font-black text-[#1B5E4B] mb-1">
                {userRankings?.overall_rank != null ? `#${userRankings.overall_rank}` : "?"}
              </div>
              <div className="text-sm text-gray-600 font-accent">overall</div>
            </m.div>
          </div>

          {/* Current Progress */}
          <div className="mt-16 text-center">
            <div className="text-4xl sm:text-5xl font-black text-[#1B5E4B] mb-3 tracking-tight">
              {formatTimeDisplay(user.total_minutes || 0)}
            </div>
            <p className="text-gray-600 mb-6 font-accent text-lg">
              {getMotivationalMessage(
                userRankings?.school_rank ?? null,
                userRankings?.school_total_users || 0,
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );

  const SchoolCompetition = () => (
    <div className="space-y-8">
      <Card
        className="shadow-sm rounded-2xl border border-gray-200"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-[#1B5E4B]">
              <Award className="w-5 h-5 text-yellow-500" />
              School Competition
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Fair comparison based on points per student on school roll
            </p>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-[#1B5E4B]/10 text-[#1B5E4B] border-[#1B5E4B]/20 self-start sm:self-auto"
          >
            <Info className="w-3 h-3" />
            Pro-rata scoring
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schoolLeaderboard.slice(0, 10).map((school, index) => {
              const isUserSchool = school.id === user.school_id;
              return (
                <m.div
                  key={school.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    layout: { type: "spring", stiffness: 350, damping: 30 },
                    delay: Math.min(index * 0.05, 0.4),
                    duration: 0.25,
                  }}
                  className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 rounded-2xl transition-all ${
                    isUserSchool
                      ? "bg-[#1B5E4B]/10 border-2 border-[#1B5E4B]/30 shadow-md"
                      : "bg-[#1B5E4B]/5 border border-gray-200 hover:bg-[#1B5E4B]/10"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl sm:text-4xl font-bold w-14 sm:w-16 text-[#1B5E4B]">
                      {getRankingEmoji(school.rank)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">
                        {school.name}
                        {isUserSchool && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs bg-[#1B5E4B]/10 text-[#1B5E4B] border-[#1B5E4B]/20"
                          >
                            Your School
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {school.total_students} students • {school.total_points || 0} points total
                        {/* {school.total_kilometers.toFixed(1)} km total */}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-bold text-[#1B5E4B]">
                      {Math.round(school.pro_rata_score)}
                    </div>
                    <div className="text-xs text-gray-400">pro-rata score</div>
                  </div>
                </m.div>
              );
            })}
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#1B5E4B] mt-0.5" />
              <div className="text-sm text-gray-600">
                <strong className="text-[#1B5E4B]">Fair Competition:</strong> Pro-rata scoring
                calculates (total points ÷ school roll number) × 100 to compare schools of different
                sizes. Schools with higher roll enrolment must encourage more students to register
                and log activities.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const HouseBattle = () => (
    <div className="space-y-8">
      <Card
        className="shadow-sm rounded-2xl border border-gray-200"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardHeader className="space-y-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-[#1B5E4B] text-lg sm:text-xl">
            <Crown className="w-5 h-5 text-yellow-500" />
            House Battle - {user.school?.name}
          </CardTitle>
          <p className="text-sm text-gray-600">Competition between houses in your school</p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {houseLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No house data available</p>
            </div>
          ) : (
            <div className="space-y-5">
              {houseLeaderboard.map((house, index) => {
                const isUserHouse = house.id === user.house_id;
                const maxPoints = Math.max(...houseLeaderboard.map((h) => h.total_points));
                const progressPercent = maxPoints > 0 ? (house.total_points / maxPoints) * 100 : 0;

                return (
                  <m.div
                    key={house.id}
                    className={`p-4 rounded-2xl space-y-3 ${
                      isUserHouse
                        ? "bg-[#1B5E4B]/10 border-2 border-[#1B5E4B]/30"
                        : "bg-[#1B5E4B]/5 border border-gray-200"
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    {/* Mobile Layout: Stacked */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side: Rank, Color, Name */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl font-bold text-[#1B5E4B] flex-shrink-0">
                          {getRankingEmoji(index + 1)}
                        </div>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: house.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-800 text-sm sm:text-base">
                            {house.name}
                            {isUserHouse && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-[10px] sm:text-xs bg-[#1B5E4B]/10 text-[#1B5E4B] border-[#1B5E4B]/20 inline-block"
                              >
                                Your House
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {house.member_count} members
                          </div>
                        </div>
                      </div>

                      {/* Right side: Points */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-lg text-[#1B5E4B]">{house.total_points}</div>
                        <div className="text-xs text-gray-400">points</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                      <Progress
                        value={progressPercent}
                        className="h-2.5"
                        style={
                          {
                            "--progress-background": house.color,
                            "--progress-foreground": house.color,
                          } as React.CSSProperties
                        }
                      />
                      {isUserHouse && (
                        <div
                          className="absolute top-0 right-2 w-2 h-2.5 rounded"
                          style={{ backgroundColor: house.color }}
                        >
                          <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </m.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    // Skeleton of the page shape (header + podium + ranked rows) instead of a
    // spinner, so the layout doesn't jump when data lands.
    return (
      <div className="px-4 py-6 sm:p-8 space-y-8 min-h-screen">
        <div className="space-y-2 animate-pulse">
          <div className="h-9 w-56 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
              <div className="h-12 flex-1 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:p-8 space-y-8 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-800">Leaderboard</h1>
          <p className="text-gray-700 text-sm sm:text-base font-accent text-lg">
            See how you and your school compare with others
          </p>
        </div>
        <m.div {...squishyTap}>
          <Button
            onClick={loadLeaderboardData}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            style={{ backgroundColor: "#1B5E4B", color: "white", borderColor: "#1B5E4B" }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </m.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList
          className="grid w-full grid-cols-3 items-center gap-2 shadow-sm rounded-2xl border border-gray-200 p-3 h-auto sm:p-4 sm:min-h-16"
          style={{ backgroundColor: "#f9fefd" }}
        >
          <TabsTrigger
            value="personal"
            className="flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-[#1B5E4B] hover:bg-[#1B5E4B]/10 transition-all duration-150 sm:px-4 sm:py-2 sm:text-base data-[state=active]:bg-[#1B5E4B] data-[state=active]:text-white"
          >
            <Trophy className="w-4 h-4" />
            Your Rankings
          </TabsTrigger>
          <TabsTrigger
            value="houses"
            className="flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-[#1B5E4B] hover:bg-[#1B5E4B]/10 transition-all duration-150 sm:px-4 sm:py-2 sm:text-base data-[state=active]:bg-[#1B5E4B] data-[state=active]:text-white"
          >
            <Crown className="w-4 h-4" />
            House Battle
          </TabsTrigger>
          <TabsTrigger
            value="schools"
            className="flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-[#1B5E4B] hover:bg-[#1B5E4B]/10 transition-all duration-150 sm:px-4 sm:py-2 sm:text-base data-[state=active]:bg-[#1B5E4B] data-[state=active]:text-white"
          >
            <Award className="w-4 h-4" />
            School Competition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalDashboard />
        </TabsContent>

        <TabsContent value="houses">
          <HouseBattle />
        </TabsContent>

        <TabsContent value="schools">
          <SchoolCompetition />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardContent;
