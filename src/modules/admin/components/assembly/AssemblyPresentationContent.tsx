import { useState, useCallback, useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { Maximize2 } from "lucide-react";
import SpotlightBackground from "./SpotlightBackground";
import AssemblyMenu from "./AssemblyMenu";
import HouseLeaderboardSlide from "./HouseLeaderboardSlide";
import TopScorersSlide from "./TopScorersSlide";
import PrizeDrawSlide from "./PrizeDrawSlide";
import ChallengeSlide from "./ChallengeSlide";
import HouseBadgeSlide from "./HouseBadgeSlide";
import HouseStatisticsSlide from "./HouseStatisticsSlide";
import SchoolLeaderboardSlide from "./SchoolLeaderboardSlide";
import WinnersGallerySlide from "./WinnersGallerySlide";
import SocialFeedSlide from "./SocialFeedSlide";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";

type Slide =
  | "menu"
  | "leaderboard"
  | "top-scorers"
  | "prize-draw"
  | "challenge"
  | "house-badges"
  | "house-stats"
  | "school-leaderboard"
  | "winners-gallery"
  | "school-feed";

interface AssemblyPresentationContentProps {
  schoolId: string;
  currentUser: UserInterface;
  students: UserInterface[];
  assemblyEvent: EventInterface | null;
  startDate?: string;
  endDate?: string;
  periodLabel?: string;
}

const AssemblyPresentationContent = ({
  schoolId,
  currentUser,
  students,
  assemblyEvent,
  startDate,
  endDate,
  periodLabel,
}: AssemblyPresentationContentProps) => {
  const [activeSlide, setActiveSlide] = useState<Slide>("menu");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="fixed inset-0 z-50 overflow-auto">
        <SpotlightBackground />

        {!isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute right-[4.5rem] top-6 z-50 rounded-full bg-white p-2 transition-colors hover:bg-white/90"
            style={{ color: "#357565" }}
            title="Enter fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        )}

        {activeSlide === "menu" && (
          <AssemblyMenu
            onSelect={(slide) => setActiveSlide(slide)}
            isFullscreen={isFullscreen}
            schoolId={schoolId}
          />
        )}

        {activeSlide === "leaderboard" && (
          <HouseLeaderboardSlide
            schoolId={schoolId}
            onBack={() => setActiveSlide("menu")}
            startDate={startDate}
            endDate={endDate}
            periodLabel={periodLabel}
          />
        )}

        {activeSlide === "top-scorers" && (
          <TopScorersSlide
            schoolId={schoolId}
            onBack={() => setActiveSlide("menu")}
            startDate={startDate}
            endDate={endDate}
            periodLabel={periodLabel}
          />
        )}

        {activeSlide === "prize-draw" && (
          <PrizeDrawSlide
            schoolId={schoolId}
            drawnByUserId={currentUser.id}
            students={students}
            onBack={() => setActiveSlide("menu")}
          />
        )}

        {activeSlide === "challenge" && (
          <ChallengeSlide assemblyEvent={assemblyEvent} onBack={() => setActiveSlide("menu")} />
        )}

        {activeSlide === "house-badges" && (
          <HouseBadgeSlide schoolId={schoolId} onBack={() => setActiveSlide("menu")} />
        )}

        {activeSlide === "house-stats" && (
          <HouseStatisticsSlide schoolId={schoolId} onBack={() => setActiveSlide("menu")} />
        )}

        {activeSlide === "school-leaderboard" && (
          <SchoolLeaderboardSlide schoolId={schoolId} onBack={() => setActiveSlide("menu")} />
        )}

        {activeSlide === "winners-gallery" && (
          <WinnersGallerySlide schoolId={schoolId} onBack={() => setActiveSlide("menu")} />
        )}

        {activeSlide === "school-feed" && (
          <SocialFeedSlide schoolId={schoolId} onBack={() => setActiveSlide("menu")} />
        )}
      </div>
    </LazyMotion>
  );
};

export default AssemblyPresentationContent;
