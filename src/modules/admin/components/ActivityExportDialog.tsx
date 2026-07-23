import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/modules/application/components/DesignSystem/ui/dialog";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Label } from "@/modules/application/components/DesignSystem/ui/label";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { Download, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { format, subMonths } from "date-fns";
import {
  ACTIVITY_TYPES,
  ALL_ACTIVITY_TYPE_LABELS,
} from "@/models/activities/interfaces/ActivityInterface";

interface ActivityExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityExportDialog = ({ isOpen, onClose }: ActivityExportDialogProps) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const oneMonthAgo = format(subMonths(new Date(), 1), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(oneMonthAgo);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const activityService = new ActivityService(createSupabaseClient());

  const convertToCSV = (rows: any[]): string => {
    if (rows.length === 0) return "No data available for the selected period";

    const headers = [
      "student_id_anonymised",
      "school_name",
      "school_code",
      "region",
      "year_group",
      "activity_type",
      "activity_type_label",
      "custom_activity_name",
      "activity_context",
      "competition_name",
      "duration_minutes",
      "distance_km",
      "house_points_awarded",
      "base_points",
      "final_points",
      "challenge_multiplier",
      "event_name",
      "participation_type",
      "notes",
      "activity_date",
      "current_streak",
      "total_user_points",
      "total_user_minutes",
      "total_user_activities",
      "weekly_active_days",
      "actual_meets_6hr_guideline",
      "movement_location",
    ];

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    return [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.student_id_anonymised,
          row.school_name,
          row.school_code,
          row.region,
          row.year_group,
          row.activity_type,
          row.activity_type_label,
          row.custom_activity_name,
          row.activity_context,
          row.competition_name,
          row.duration_minutes,
          row.distance_km,
          row.house_points_awarded,
          row.base_points,
          row.final_points,
          row.challenge_multiplier,
          row.event_name,
          row.participation_type,
          row.notes,
          row.activity_date,
          row.current_streak,
          row.total_user_points,
          row.total_user_minutes,
          row.total_user_activities,
          row.weekly_active_days,
          row.actual_meets_6hr_guideline,
          row.movement_location,
        ]
          .map(escapeCSV)
          .join(","),
      ),
    ].join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    setIsExporting(true);
    try {
      const supabase = createSupabaseClient();

      const { data: activities, error } = await supabase
        .from("activities")
        .select(
          `
          id, created_at, activity_type, custom_activity_name, activity_context, competition_name,
          duration_minutes, distance_km,
          house_points_awarded, base_points, final_points,
          challenge_points_multiplier, feeling, participation_type, description,
          user_id,
          user:users!activities_user_id_fkey(
            id, year_group, class, current_streak, total_points, total_minutes,
            school:schools(name, code, region)
          ),
          event:events(name)
        `,
        )
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .is("is_rejected", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (activities || []).map((a: any) => {
        const user = a.user;
        const school = user?.school;
        const weeklyMinutes = user?.total_minutes || 0;
        const meets6hr = weeklyMinutes >= 360;
        const customName = a.custom_activity_name;
        const activityLabel =
          a.activity_type === "something_else" && customName
            ? customName
            : ALL_ACTIVITY_TYPE_LABELS[a.activity_type as keyof typeof ACTIVITY_TYPES] ||
              a.activity_type;

        return {
          student_id_anonymised: a.user_id ? a.user_id.toString().slice(0, 8) + "..." : "",
          school_name: school?.name || "",
          school_code: school?.code || "",
          region: school?.region || "",
          year_group: user?.year_group || "",
          activity_type: a.activity_type,
          activity_type_label: activityLabel,
          custom_activity_name: customName || "",
          activity_context: a.activity_context || "",
          competition_name: a.competition_name || "",
          duration_minutes: a.duration_minutes || 0,
          distance_km: a.distance_km || 0,
          house_points_awarded: a.house_points_awarded || 0,
          base_points: a.base_points || 0,
          final_points: a.final_points || 0,
          challenge_multiplier: a.challenge_points_multiplier || 1,
          event_name: a.event?.name || "",
          participation_type: a.participation_type || "",
          notes: a.description || "",
          activity_date: format(new Date(a.created_at), "yyyy-MM-dd"),
          current_streak: user?.current_streak || 0,
          total_user_points: user?.total_points || 0,
          total_user_minutes: user?.total_minutes || 0,
          total_user_activities: 0,
          weekly_active_days: 0,
          actual_meets_6hr_guideline: meets6hr ? "Yes" : "No",
          movement_location: a.participation_type === "with_others" ? "Team/Social" : "Solo",
        };
      });

      const csv = convertToCSV(rows);
      const filename = `karawhiua-movement-export-${startDate}-to-${endDate}.csv`;
      downloadCSV(csv, filename);
      toast.success(`Exported ${rows.length} activity records`);
      onClose();
    } catch (err: any) {
      notifyAboutError(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Movement Data
          </DialogTitle>
          <DialogDescription>
            Download a CSV of all activity records for a custom date range. Includes school, region,
            and calculated fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="w-full py-2 px-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-[#1B5E4B]/40 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={today}
              className="w-full py-2 px-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-[#1B5E4B]/40 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-500">
            Export includes: student ID (anonymised), school, region, year group, activity type, custom activity name, context, competition, duration, points, event, notes, streak, weekly stats, and 6+ hour guideline status.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityExportDialog;
