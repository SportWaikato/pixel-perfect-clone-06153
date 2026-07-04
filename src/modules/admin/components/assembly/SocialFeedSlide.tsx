import { useState, useEffect } from "react";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { Heart, Camera, ChevronLeft } from "lucide-react";

interface SocialFeedSlideProps {
  schoolId: string;
  onBack: () => void;
}

const activityService = new ActivityService(createSupabaseClient());

const BackButton = ({ onBack }: { onBack: () => void }) => (
  <button
    onClick={onBack}
    className="absolute left-6 top-6 rounded-full p-2 transition-colors"
    style={{ backgroundColor: "#d9d8d4", color: "#0f172a" }}
  >
    <ChevronLeft className="h-6 w-6" />
  </button>
);

const SocialFeedSlide = ({ schoolId, onBack }: SocialFeedSlideProps) => {
  const [photos, setPhotos] = useState<ActivityInterface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // getTopFeedPhotos only returns is_shared_to_feed + feed_approved rows,
        // so nothing unmoderated can ever appear on the big screen.
        const data = await activityService.getTopFeedPhotos(schoolId, 7, 3);
        setPhotos(data);
      } catch {
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <BackButton onBack={onBack} />
        <p className="text-white/60 text-xl">Loading top moments…</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <BackButton onBack={onBack} />
        <Camera size={48} className="text-white/30 mb-4" />
        <h2 className="text-3xl font-black text-white mb-2">No moments yet this week</h2>
        <p className="text-white/50 text-lg">
          Approved photos students share to the feed will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <BackButton onBack={onBack} />
      <div className="flex items-center gap-2 mb-6">
        <Heart size={24} className="text-[#D103D1]" fill="#D103D1" />
        <h2 className="text-3xl font-black text-white">This Week's Top Moments</h2>
      </div>
      <div className="flex gap-4 items-start justify-center">
        {photos.map((activity, idx) => {
          const user = (activity.user as unknown as Record<string, unknown>) || {};
          const house = (user.house as Record<string, unknown>) || {};
          const isCenter = idx === 1;

          return (
            <div
              key={activity.id}
              className={`flex flex-col items-center ${isCenter ? "scale-110 z-10" : ""}`}
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                {activity.proof_image_url ? (
                  <img
                    src={activity.proof_image_url}
                    alt="Feed moment"
                    className={`object-cover ${isCenter ? "w-56 h-56" : "w-44 h-44"}`}
                  />
                ) : (
                  <div
                    className={`flex items-center justify-center bg-white/10 ${isCenter ? "w-56 h-56" : "w-44 h-44"}`}
                  >
                    <Camera size={32} className="text-white/30" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full">
                    {(user.first_name as string) || ""}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full">
                    <Heart size={10} fill="white" />
                    {activity.feed_likes || 0}
                  </span>
                </div>
              </div>
              <p className="text-white/70 text-xs mt-2">
                {house.name as string} · {activity.duration_minutes} min
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-white/40 text-sm mt-6">Most liked activity moments from the past 7 days</p>
    </div>
  );
};

export default SocialFeedSlide;
