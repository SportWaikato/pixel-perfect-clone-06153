"use client";

import { m } from "framer-motion";
import { useState, useMemo } from "react";
import {
  AchievementInterface,
  UserAchievementInterface,
} from "@/models/achievements/interfaces/AchievementInterface";
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
import { Award, Lock, CheckCircle } from "lucide-react";
import { BadgeImageHelper } from "@/models/achievements/helpers/BadgeImageHelper";
import PageHeader from "@/modules/application/components/Layout/PageHeader";

type FilterTab = "all" | "earned" | "unearned";

interface AchievementsGridProps {
  userAchievements: UserAchievementInterface[];
  allAchievements: AchievementInterface[];
}

const AchievementsGrid = ({ userAchievements, allAchievements }: AchievementsGridProps) => {
  const [filter, setFilter] = useState<FilterTab>("all");

  const earnedAchievementIds = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievement_id)),
    [userAchievements],
  );

  const filteredAchievements = useMemo(() => {
    switch (filter) {
      case "earned":
        return allAchievements.filter((a) => earnedAchievementIds.has(a.id));
      case "unearned":
        return allAchievements.filter((a) => !earnedAchievementIds.has(a.id));
      default:
        return allAchievements;
    }
  }, [allAchievements, filter, earnedAchievementIds]);

  const earnedCount = userAchievements.length;

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: allAchievements.length },
    { key: "earned", label: "Earned", count: earnedCount },
    { key: "unearned", label: "Not Yet Earned", count: allAchievements.length - earnedCount },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <PageHeader
        title="Badges"
        subtitle="Earn badges by logging activities, staying consistent, and hitting milestones"
        icon={Award}
      />

      <div className="flex gap-2 mb-6">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={filter === tab.key ? "default" : "outline"}
            onClick={() => setFilter(tab.key)}
            className="font-semibold gap-2"
            style={filter === tab.key ? { backgroundColor: "#1B5E4B", color: "white" } : {}}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                style={
                  filter === tab.key
                    ? { backgroundColor: "rgba(255,255,255,0.25)", color: "white" }
                    : { backgroundColor: "#1B5E4B", color: "white" }
                }
              >
                {tab.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {filteredAchievements.length === 0 ? (
        <Card
          className="shadow-sm rounded-2xl border border-gray-200"
          style={{ backgroundColor: "#f9fefd" }}
        >
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-bold text-[#1B5E4B] font-accent">
              {filter === "earned" ? "No badges earned yet" : "No achievements found"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {filter === "earned"
                ? "Keep logging activities to earn your first badge!"
                : filter === "unearned"
                  ? "Great job — you've earned all available achievements!"
                  : "Achievements will appear here once they are created"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredAchievements.map((achievement, cardIndex) => {
              const isEarned = earnedAchievementIds.has(achievement.id);
              const userAchievement = userAchievements.find(
                (ua) => ua.achievement_id === achievement.id,
              );

              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <m.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(cardIndex * 0.04, 0.5), duration: 0.25 }}
                      className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                        isEarned
                          ? "bg-white border-gray-200 shadow-sm"
                          : "bg-gray-100 border-gray-200 opacity-60"
                      }`}
                      whileHover={{ scale: 1.06, y: -2 }}
                    >
                      <div className="text-center">
                        {BadgeImageHelper.hasBadgeImage(achievement) ? (
                          <div className="w-32 h-32 mx-auto mb-3 relative overflow-hidden rounded-xl">
                            <img
                              src={BadgeImageHelper.getBadgeImageUrl(achievement)}
                              alt={achievement.name}
                              sizes="128px"
                              className={`w-full h-full object-contain ${isEarned ? "" : "grayscale opacity-60"}`}
                            />
                            {isEarned && (
                              <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`w-32 h-32 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                              isEarned
                                ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isEarned ? (
                              <Award className="w-16 h-16" />
                            ) : (
                              <Lock className="w-12 h-12" />
                            )}
                          </div>
                        )}
                        <div
                          className={`text-xs sm:text-sm font-medium ${
                            isEarned ? "text-gray-800" : "text-gray-500"
                          }`}
                        >
                          {achievement.name}
                        </div>
                        {achievement.points_reward > 0 && (
                          <div
                            className="text-xs mt-1"
                            style={{ color: isEarned ? "#D103D1" : "#9ca3af" }}
                          >
                            +{achievement.points_reward} pts
                          </div>
                        )}
                        {isEarned && userAchievement && (
                          <Badge
                            variant="secondary"
                            className="mt-2 text-xs bg-green-100 text-green-700 border-green-200 font-accent"
                          >
                            Earned
                          </Badge>
                        )}
                      </div>
                    </m.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-center">
                      <div className="font-semibold text-sm mb-1">{achievement.name}</div>
                      <div className="text-xs text-gray-300">{achievement.description}</div>
                      {isEarned && userAchievement && (
                        <div className="text-xs text-green-400 mt-1 font-medium">
                          ✓ Earned {new Date(userAchievement.earned_at).toLocaleDateString()}
                        </div>
                      )}
                      {!isEarned && (
                        <div className="text-xs text-gray-300 mt-1">
                          <Lock size={10} className="inline mr-1" />
                          Not yet earned
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};

export default AchievementsGrid;
