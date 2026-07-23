import { useState } from "react";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { ActivityInterface } from "@/models/activities/interfaces/ActivityInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityService } from "@/models/activities/services/ActivityService";
import LogActivityForm from "./LogActivityForm";
import LogActivityWizard from "./LogActivityWizard/LogActivityWizard";
import ActivityHistory from "./ActivityHistory";
import SchoolPulseWall from "@/modules/dashboard/components/SchoolPulseWall";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import PageHeader from "@/modules/application/components/Layout/PageHeader";
import Reveal from "@/modules/application/components/Layout/Reveal";
import { Zap } from "lucide-react";

interface ActivitiesContentProps {
  user: UserInterface;
  initialActivities: ActivityInterface[];
  initialChallenges: EventInterface[];
}

const ActivitiesContent = ({
  user,
  initialActivities,
  initialChallenges,
}: ActivitiesContentProps) => {
  const [activities, setActivities] = useState<ActivityInterface[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityInterface | undefined>(undefined);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const activityService = new ActivityService(supabase);
      const userActivities = await activityService.getByUserId(user.id, 20);
      setActivities(userActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityAdded = () => {
    // Refresh the activities list when a new activity is added
    fetchActivities();
  };

  const handleEditActivity = (activity: ActivityInterface) => {
    setEditingActivity(activity);
  };

  const handleEditComplete = () => {
    setEditingActivity(undefined);
    fetchActivities(); // Refresh activities after edit
  };

  const handleCancelEdit = () => {
    setEditingActivity(undefined);
  };

  const handleDeleteActivity = async (activity: ActivityInterface) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this activity? This action cannot be undone.",
      );

      if (!confirmed) {
        return;
      }

      const supabase = createSupabaseClient();
      const activityService = new ActivityService(supabase);
      await activityService.delete(activity.id, user.id);

      toast.success("Activity deleted successfully");

      if (editingActivity?.id === activity.id) {
        setEditingActivity(undefined);
      }

      fetchActivities();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <PageHeader
        title="Log Activity"
        subtitle="Every move counts — record what you did and earn points for your House."
        icon={Zap}
      />

      {user.school_id && <SchoolPulseWall schoolId={user.school_id} />}

      <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {editingActivity ? (
          <LogActivityForm
            user={user}
            editingActivity={editingActivity}
            onEditComplete={handleEditComplete}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <LogActivityWizard
            user={user}
            initialChallenges={initialChallenges}
            onActivityAdded={handleActivityAdded}
          />
        )}
        <ActivityHistory
          activities={activities}
          loading={loading}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      </Reveal>
    </div>
  );
};

export default ActivitiesContent;
