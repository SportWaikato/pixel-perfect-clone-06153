"use client";

import { useState, useEffect, useMemo } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { Card, CardContent } from "@/modules/application/components/DesignSystem/ui/card";
import { Badge } from "@/modules/application/components/DesignSystem/ui/badge";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventService } from "@/models/events/services/EventService";
import { ArrowLeft, Clock, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { formatEventDate } from "@/modules/common/utils/dateUtils";
import { Link } from "@tanstack/react-router";

interface MySuggestionsContentProps {
  user: UserInterface;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    bgColor: "#FEF3C7",
    textColor: "#92400E",
    borderColor: "#F59E0B",
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    bgColor: "#D1FAE5",
    textColor: "#065F46",
    borderColor: "#10B981",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    bgColor: "#FEE2E2",
    textColor: "#991B1B",
    borderColor: "#EF4444",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    bgColor: "#F3F4F6",
    textColor: "#6B7280",
    borderColor: "#9CA3AF",
  },
} as const;

const MySuggestionsContent = ({ user }: MySuggestionsContentProps) => {
  const [suggestions, setSuggestions] = useState<EventInterface[]>([]);
  const [loading, setLoading] = useState(true);

  const eventService = useMemo(() => new EventService(createSupabaseClient()), []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const data = await eventService.getEventsCreatedByUser(user.id);
        setSuggestions(data);
      } catch (error) {
        notifyAboutError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user.id, eventService]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: "#f5faf8" }}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/challenges">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black text-[#1B5E4B]">My Suggestions</h1>
          <p className="text-sm" style={{ color: "#357665" }}>
            Challenges you&apos;ve submitted for approval
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <Card className="rounded-2xl border border-gray-100">
          <CardContent className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Suggestions Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t submitted any challenge suggestions. Share your ideas!
            </p>
            <Button asChild style={{ backgroundColor: "#1B5E4B", color: "white" }}>
              <Link to="/challenges">Browse Challenges</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const status = (suggestion.approval_status || "pending") as keyof typeof statusConfig;
            const config = statusConfig[status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <Card key={suggestion.id} className="rounded-2xl border border-gray-100 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {suggestion.suggestion_image_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        <img
                          src={suggestion.suggestion_image_url}
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#f0f5f4", color: "#3e7c6c" }}
                      >
                        <ImageIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#1B5E4B] truncate">{suggestion.name}</h3>
                        <Badge
                          variant="outline"
                          className="shrink-0 gap-1 text-xs px-2 py-0.5 h-5 border-0"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.textColor,
                          }}
                        >
                          <StatusIcon size={10} />
                          {config.label}
                        </Badge>
                      </div>
                      {suggestion.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {suggestion.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Submitted {formatEventDate(suggestion.created_at, "d MMM yyyy")}
                      </p>
                      {status === "rejected" && suggestion.rejection_reason && (
                        <div
                          className="mt-3 p-3 rounded-lg border"
                          style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
                        >
                          <p className="text-xs font-semibold mb-1" style={{ color: "#991B1B" }}>
                            Rejection reason:
                          </p>
                          <p className="text-sm" style={{ color: "#7F1D1D" }}>
                            {suggestion.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySuggestionsContent;
