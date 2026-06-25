import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/modules/application/components/DesignSystem/ui/dialog';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/application/components/DesignSystem/ui/select';
import { Label } from '@/modules/application/components/DesignSystem/ui/label';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { ActivityService } from '@/models/activities/services/ActivityService';
import { Download, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ACTIVITY_TYPES } from '@/models/activities/interfaces/ActivityInterface';

interface ActivityExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityExportDialog = ({ isOpen, onClose }: ActivityExportDialogProps) => {
  // Default to current month
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [isExporting, setIsExporting] = useState(false);

  const activityService = new ActivityService(createSupabaseClient());

  // Generate last 12 months for selection
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }

    return options;
  };

  const monthOptions = getMonthOptions();

  // Convert activity data to CSV format
  const convertToCSV = (activities: any[]): string => {
    if (activities.length === 0) {
      return 'No data available for the selected period';
    }

    // Define CSV headers
    const headers = [
      'Activity ID',
      'Date',
      'Time',
      'User ID',
      'Username',
      'First Name',
      'Last Name',
      'School Name',
      'School Code',
      'House Name',
      'Activity Type',
      'Duration (minutes)',
      'Distance (km)',
      'Points Awarded',
      'Base Points',
      'Final Points',
      'Challenge Multiplier',
      'Event/Challenge Name',
      'Feeling',
      'Participation Type',
      'Description',
      'Year Group',
      'Current Streak',
      'Total User Points',
      'Total User Minutes'
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV rows
    const rows = activities.map(activity => {
      const dateTime = new Date(activity.created_at);
      const activityTypeName = ACTIVITY_TYPES[activity.activity_type as keyof typeof ACTIVITY_TYPES] || activity.activity_type;

      return [
        activity.id,
        format(dateTime, 'yyyy-MM-dd'),
        format(dateTime, 'HH:mm:ss'),
        activity.user_id,
        activity.user?.username || '',
        activity.user?.first_name || '',
        activity.user?.last_name || '',
        activity.user?.school?.name || '',
        activity.user?.school?.code || '',
        activity.user?.house?.name || '',
        activityTypeName,
        activity.duration_minutes || 0,
        activity.distance_km || 0,
        activity.house_points_awarded || 0,
        activity.base_points || 0,
        activity.final_points || 0,
        activity.challenge_points_multiplier || 1,
        activity.event?.name || '',
        activity.feeling || '',
        activity.participation_type || '',
        activity.description || '',
        activity.user?.year_group || '',
        activity.user?.current_streak || 0,
        activity.user?.total_points || 0,
        activity.user?.total_minutes || 0
      ].map(escapeCSV);
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedMonth) {
      toast.error('Please select a month to export');
      return;
    }

    setIsExporting(true);

    try {
      // Parse selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Fetch activities for the selected month
      const activityService = new ActivityService(createSupabaseClient());
      const activities = await activityService.getActivitiesByDateRange(startDate, endDate);

      if (!activities || activities.length === 0) {
        toast.warning('No activities found for the selected month');
        return;
      }

      if (activities.length === 10000) {
        toast.warning('Export is limited to 10,000 activities. Some records may be missing — contact support for a full export.');
      }

      // Convert to CSV
      const csvContent = convertToCSV(activities);

      // Generate filename
      const monthName = format(startDate, 'MMMM-yyyy');
      const filename = `karawhiua-activities-${monthName}.csv`;

      // Download the file
      downloadCSV(csvContent, filename);

      toast.success(`Exported ${activities.length} activities for ${format(startDate, 'MMMM yyyy')}`);
      onClose();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Activity Data
          </DialogTitle>
          <DialogDescription>
            Select a month to export all activity data as CSV for analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month-select">Select Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Choose a month to export">
                  {selectedMonth && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {monthOptions.find(m => m.value === selectedMonth)?.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The export will include all activities, user details, schools, houses, and points data.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 space-y-1">
            <p className="text-sm font-medium text-blue-900">Export includes:</p>
            <ul className="text-xs text-blue-700 space-y-0.5 ml-4 list-disc">
              <li>Activity details (type, duration, distance, points)</li>
              <li>User information (name, username, email)</li>
              <li>School and house assignments</li>
              <li>Challenge participation and multipliers</li>
              <li>Feelings and participation type</li>
              <li>User statistics (streak, total points)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !selectedMonth}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityExportDialog;