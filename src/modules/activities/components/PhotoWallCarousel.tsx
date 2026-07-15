import { useState, useEffect, useRef } from "react";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Image, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { getActivityIcon, getActivityColor } from "@/modules/activities/utils/activityIcons";

interface PhotoWallCarouselProps {
  schoolId: string;
  maxPhotos?: number;
}

const PhotoWallCarousel = ({ schoolId, maxPhotos = 20 }: PhotoWallCarouselProps) => {
  const [photos, setPhotos] = useState<ActivityInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityInterface | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) return;
    const service = new ActivityService(createSupabaseClient());
    service
      .getTopFeedPhotos(schoolId, 7, maxPhotos)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [schoolId, maxPhotos]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading || photos.length === 0) return null;

  return (
    <>
      <Card className="shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image size={18} className="text-[#D103D1]" />
              <span className="font-semibold text-gray-800 text-sm">Photo Wall</span>
              <span className="text-xs text-gray-400">Last 7 days</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {photos.map((activity) => {
              const user = (activity.user as unknown as Record<string, unknown>) || {};
              const house = (user.house as Record<string, unknown>) || {};

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => setSelectedPhoto(activity)}
                  className="flex-shrink-0 w-36 sm:w-44 snap-start group"
                >
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    <img
                      src={activity.proof_image_url!}
                      alt=""
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: (house.color as string) || "#1B5E4B" }}
                        >
                          {((user.first_name as string) || "")[0]}
                          {((user.last_name as string) || "")[0]}
                        </div>
                        <span className="text-white text-xs truncate font-medium">
                          {user.first_name as string}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 text-white text-xs">
                      <Heart size={10} fill="white" />
                      {activity.feed_likes || 0}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-10 right-0 text-white text-sm hover:underline"
              >
                Close
              </button>
              <img
                src={selectedPhoto.proof_image_url!}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
              <div className="mt-3 text-white text-center">
                <p className="font-medium">
                  {((selectedPhoto.user as unknown as Record<string, unknown>)
                    ?.first_name as string) || "Student"}{" "}
                  {((selectedPhoto.user as unknown as Record<string, unknown>)
                    ?.last_name as string) || ""}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {selectedPhoto.activity_type.replace(/_/g, " ")}
                  {selectedPhoto.duration_minutes ? ` · ${selectedPhoto.duration_minutes} min` : ""}
                </p>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotoWallCarousel;
