"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/application/components/DesignSystem/ui/card";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { SchoolTermService } from "@/models/terms/services/SchoolTermService";
import { SchoolTermInterface } from "@/models/terms/interfaces/SchoolTermInterface";
import { Calendar, TrendingUp, Star } from "lucide-react";

interface StudentProgressionCardProps {
  userId: string;
  schoolId: string;
  lifetimePoints: number;
  variant?: "full" | "compact";
}

const StudentProgressionCard = ({
  userId,
  schoolId,
  lifetimePoints: initialLifetimePoints,
  variant = "full",
}: StudentProgressionCardProps) => {
  const [currentTerm, setCurrentTerm] = useState<SchoolTermInterface | null>(null);
  const [termPoints, setTermPoints] = useState<number>(0);
  const [yearPoints, setYearPoints] = useState<number>(0);
  const [lifetimePoints, setLifetimePoints] = useState<number>(initialLifetimePoints);
  const [loading, setLoading] = useState(true);

  const termService = useMemo(() => new SchoolTermService(createSupabaseClient()), []);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const fetchProgression = async () => {
      try {
        setLoading(true);
        const term = await termService.getCurrentTerm(schoolId);
        setCurrentTerm(term);

        if (term) {
          const termPromises: Promise<void>[] = [];

          const termPointsPromise = supabase
            .rpc("get_term_points", {
              p_entity_type: "user",
              p_entity_id: userId,
              p_term_id: term.id,
            })
            .then(({ data, error }) => {
              if (!error) setTermPoints(data || 0);
            });

          const yearPointsPromise = supabase
            .from("activities")
            .select("final_points")
            .eq("user_id", userId)
            .is("is_rejected", false)
            .gte("created_at", `${term.year}-01-01`)
            .lte("created_at", `${term.year}-12-31`)
            .then(({ data, error }) => {
              if (!error && data) {
                setYearPoints(
                  (data as { final_points: number }[]).reduce(
                    (sum, a) => sum + (a.final_points || 0),
                    0,
                  ),
                );
              }
            });

          const lifetimePromise = supabase
            .from("users")
            .select("total_points")
            .eq("id", userId)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setLifetimePoints((data as { total_points: number }).total_points || 0);
              }
            });

          await Promise.all([termPointsPromise, yearPointsPromise, lifetimePromise]);
        } else {
          const [yp, lp] = await Promise.all([
            supabase
              .from("activities")
              .select("final_points")
              .eq("user_id", userId)
              .is("is_rejected", false)
              .gte("created_at", "2026-01-01")
              .lte("created_at", "2026-12-31")
              .then(({ data, error }) => {
                if (!error && data) {
                  setYearPoints(
                    (data as { final_points: number }[]).reduce(
                      (sum, a) => sum + (a.final_points || 0),
                      0,
                    ),
                  );
                }
              }),
            supabase
              .from("users")
              .select("total_points")
              .eq("id", userId)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  setLifetimePoints((data as { total_points: number }).total_points || 0);
                }
              }),
          ]);
        }
      } catch (error) {
        console.error("Error fetching progression:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgression();
  }, [userId, schoolId, termService]);

  const termName = useMemo(() => {
    if (!currentTerm) return null;
    return `Term ${currentTerm.term_number} ${currentTerm.year}`;
  }, [currentTerm]);

  const termProgressPercent = useMemo(() => {
    if (!currentTerm) return 0;
    const start = new Date(currentTerm.start_date).getTime();
    const end = new Date(currentTerm.end_date).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [currentTerm]);

  const isNewTerm = useMemo(() => {
    if (!currentTerm) return false;
    const start = new Date(currentTerm.start_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [currentTerm]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <Card
        className="shadow-sm rounded-2xl border border-gray-200"
        style={{ backgroundColor: "#f9fefd" }}
      >
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 border border-gray-100 bg-white">
        {currentTerm && (
          <>
            <div
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#1B5E4B18", color: "#1B5E4B" }}
            >
              <Calendar size={16} />
            </div>
            <div className="flex-1 min-w-0">
              {isNewTerm && (
                <span className="text-xs font-bold text-[#D103D1] uppercase tracking-wide">
                  New Term!
                </span>
              )}
              <p className="text-sm font-bold text-[#1B5E4B]">
                This term: <span style={{ color: "#D103D1" }}>{termPoints} pts</span>
              </p>
              <p className="text-xs text-gray-500">
                {termName} · {formatDate(currentTerm.start_date)} –{" "}
                {formatDate(currentTerm.end_date)}
              </p>
            </div>
          </>
        )}
        {!currentTerm && <p className="text-sm text-gray-500">No current term found</p>}
      </div>
    );
  }

  return (
    <Card
      className="shadow-sm rounded-2xl border border-gray-200"
      style={{ backgroundColor: "#f9fefd" }}
    >
      <CardHeader className="px-8 pt-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-2xl font-black text-[#1B5E4B]">
          <TrendingUp size={20} className="text-[#1B5E4B]" />
          Your Progression
        </CardTitle>
        {isNewTerm && (
          <div
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: "#FDE8FD", color: "#D103D1" }}
          >
            <Star size={12} />
            New Term — points reset for this term!
          </div>
        )}
      </CardHeader>
      <CardContent className="px-8 pb-6 space-y-4">
        {currentTerm && termName && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} />
              <span className="font-semibold text-[#1B5E4B]">{termName}</span>
              <span>
                ({formatDate(currentTerm.start_date)} – {formatDate(currentTerm.end_date)})
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Term progress</span>
                <span>{termProgressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(termProgressPercent, 100)}%`,
                    backgroundColor: "#1B5E4B",
                  }}
                />
              </div>
            </div>
          </>
        )}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="py-4 px-3 rounded-2xl bg-white border border-gray-100">
            <div className="text-3xl font-black" style={{ color: "#D103D1" }}>
              {termPoints}
            </div>
            <p className="text-xs text-gray-500 mt-1">{termName || "Current Term"}</p>
          </div>
          <div className="py-4 px-3 rounded-2xl bg-white border border-gray-100">
            <div className="text-3xl font-black text-[#1B5E4B]">{yearPoints}</div>
            <p className="text-xs text-gray-500 mt-1">
              {currentTerm ? `${currentTerm.year} Year` : "2026 Year"}
            </p>
          </div>
          <div className="py-4 px-3 rounded-2xl bg-white border border-gray-100">
            <div className="text-3xl font-black text-[#1B5E4B]">{lifetimePoints}</div>
            <p className="text-xs text-gray-500 mt-1">Lifetime</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressionCard;
