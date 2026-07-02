import { useEffect, useMemo, useState } from "react";
import { Formik, Form, useFormikContext } from "formik";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/application/components/DesignSystem/ui/dialog";
import { editEventSchema, EventAudienceOption } from "@/models/forms/schemas/eventSchemas";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { SelectItem } from "@/modules/application/components/DesignSystem/ui/select";
import {
  FormikInputField,
  FormikSelectField,
  FormikTextareaField,
  FormikSwitchField,
} from "@/modules/common/components/Formik";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { EventService } from "@/models/events/services/EventService";
import { AchievementService } from "@/models/achievements/services/AchievementService";
import { isSuperAdmin as checkIsSuperAdmin } from "@/modules/auth/utils/roleUtils";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { AchievementInterface } from "@/models/achievements/interfaces/AchievementInterface";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Loader2 } from "lucide-react";
import BadgeImagePicker, {
  BadgeImageSelection,
} from "@/modules/admin/components/badges/BadgeImagePicker";
import AIBadgeGenerator from "@/modules/admin/components/badges/AIBadgeGenerator";
import BadgeCriteriaBuilder from "@/modules/admin/components/badges/BadgeCriteriaBuilder";
import {
  type BadgeFormValues,
  buildBadgeCriteriaFromValues,
  getInitialBadgeFormValues,
  parseBadgeNumberField,
} from "@/modules/admin/components/badges/badgeCriteriaHelpers";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import EventIconPicker from "@/modules/admin/components/EventIconPicker";
import SchoolCheckboxList from "@/modules/admin/components/SchoolCheckboxList";
import SubmitButton from "@/modules/admin/components/SubmitButton";
import EventImageUpload, { EventImageState } from "@/modules/admin/components/EventImageUpload";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventInterface | null;
  onEventUpdated: () => void;
  user: UserInterface;
}

interface EditEventFormValues {
  name: string;
  description: string;
  event_type: string;
  icon_type: string;
  start_date: string;
  end_date: string;
  target_hours: number | null;
  challenge_points: number | null;
  youtube_video_url: string;
  audience: EventAudienceOption;
  selected_school_ids: string[];
  is_assembly: boolean;
  shouldCreateBadge: boolean;
  badge: BadgeFormValues;
}

const EditEventDialog = ({
  open,
  onOpenChange,
  event,
  onEventUpdated,
  user,
}: EditEventDialogProps) => {
  const eventService = useMemo(() => new EventService(createSupabaseClient()), []);
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [selectedBadgeImage, setSelectedBadgeImage] = useState<BadgeImageSelection | null>(null);
  const [existingBadge, setExistingBadge] = useState<AchievementInterface | null>(null);
  const [isLoadingBadge, setIsLoadingBadge] = useState(false);

  const [eventImageState, setEventImageState] = useState<EventImageState | null>(
    event?.event_image_url
      ? { url: event.event_image_url, path: event.event_image_storage_path || "" }
      : null,
  );

  const isSuperAdmin = checkIsSuperAdmin(user);
  const viewerSchoolId = user.school_id;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!event?.badge_achievement_id) {
      setExistingBadge(null);
      return;
    }

    const loadBadge = async () => {
      try {
        setIsLoadingBadge(true);
        const supabaseClient = createSupabaseClient();
        const achievementService = new AchievementService(supabaseClient);
        const badge = await achievementService.getById(event.badge_achievement_id!);
        setExistingBadge(badge);
      } catch (error) {
        notifyAboutError(error);
      } finally {
        setIsLoadingBadge(false);
      }
    };

    loadBadge();
  }, [open, event?.badge_achievement_id]);

  useEffect(() => {
    if (!open) {
      setSelectedBadgeImage(null);
      return;
    }
    setEventImageState(
      event?.event_image_url
        ? { url: event.event_image_url, path: event.event_image_storage_path || "" }
        : null,
    );
  }, [open, event?.id]);

  useEffect(() => {
    if (existingBadge) {
      setSelectedBadgeImage({
        storage_url: existingBadge.storage_url,
        storage_path: existingBadge.storage_path,
        is_custom_upload: existingBadge.is_custom_upload,
        image_filename: existingBadge.image_filename,
      });
    }
  }, [existingBadge]);

  useEffect(() => {
    if (!open || !isSuperAdmin) {
      return;
    }

    const loadSchools = async () => {
      try {
        setIsLoadingSchools(true);
        const supabaseClient = createSupabaseClient();
        const schoolService = new SchoolService(supabaseClient);
        const fetchedSchools = await schoolService.getAll(true);
        setSchools(fetchedSchools);
      } catch (error) {
        notifyAboutError(error);
      } finally {
        setIsLoadingSchools(false);
      }
    };

    loadSchools();
  }, [open, isSuperAdmin]);

  const sportWaikatoSchoolIds = useMemo(
    () => schools.filter((school) => school.is_internal).map((school) => school.id),
    [schools],
  );

  const audienceInfo = useMemo((): {
    audience: EventAudienceOption;
    selectedSchoolIds: string[];
  } => {
    if (!event) {
      return {
        audience: isSuperAdmin ? "all_schools" : "creator_school",
        selectedSchoolIds: viewerSchoolId ? [viewerSchoolId] : [],
      };
    }

    const targetIds = Array.from(new Set(event.target_schools || []));

    if (!event.target_schools || event.target_schools.length === 0) {
      return {
        audience: "all_schools" as EventAudienceOption,
        selectedSchoolIds: [],
      };
    }

    if (isSuperAdmin) {
      const sportSetMatches =
        sportWaikatoSchoolIds.length > 0 &&
        targetIds.length === sportWaikatoSchoolIds.length &&
        targetIds.every((id) => sportWaikatoSchoolIds.includes(id));

      if (sportSetMatches) {
        return {
          audience: "sport_waikato" as EventAudienceOption,
          selectedSchoolIds: sportWaikatoSchoolIds,
        };
      }

      return {
        audience: "custom" as EventAudienceOption,
        selectedSchoolIds: targetIds,
      };
    }

    return {
      audience: "creator_school" as EventAudienceOption,
      selectedSchoolIds: targetIds.length > 0 ? targetIds : viewerSchoolId ? [viewerSchoolId] : [],
    };
  }, [event, isSuperAdmin, sportWaikatoSchoolIds, viewerSchoolId]);

  const initialValues: EditEventFormValues = {
    name: event?.name ?? "",
    description: event?.description ?? "",
    event_type: event?.event_type ?? "mixed",
    icon_type: event?.icon_type ?? "",
    start_date: event?.start_date ? event.start_date.substring(0, 10) : "",
    end_date: event?.end_date ? event.end_date.substring(0, 10) : "",
    target_hours: event?.target_minutes ? Math.round(event.target_minutes / 60) : null,
    challenge_points: event?.challenge_points ?? null,
    youtube_video_url: event?.youtube_video_url ?? "",
    audience: audienceInfo.audience,
    selected_school_ids: audienceInfo.selectedSchoolIds,
    is_assembly: event?.is_assembly ?? false,
    shouldCreateBadge: Boolean(event?.badge_achievement_id),
    badge: getInitialBadgeFormValues(existingBadge),
  };

  const handleBadgeImageSelect = (selection: BadgeImageSelection | null) => {
    setSelectedBadgeImage(selection);
  };

  const handleSubmit = async (
    values: EditEventFormValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    if (!event) return;

    try {
      if (
        isSuperAdmin &&
        values.audience === "sport_waikato" &&
        sportWaikatoSchoolIds.length === 0
      ) {
        toast.error(
          "No internal (Sport Waikato) schools are configured yet. Please choose another audience.",
        );
        setSubmitting(false);
        return;
      }

      const resolvedTargetSchools = (() => {
        if (!isSuperAdmin) {
          return event.target_schools && event.target_schools.length > 0
            ? event.target_schools
            : viewerSchoolId
              ? [viewerSchoolId]
              : [];
        }

        switch (values.audience) {
          case "all_schools":
            return null;
          case "sport_waikato":
            return sportWaikatoSchoolIds;
          case "custom":
            return values.selected_school_ids;
          case "creator_school":
          default:
            return event.target_schools && event.target_schools.length > 0
              ? event.target_schools
              : viewerSchoolId
                ? [viewerSchoolId]
                : [];
        }
      })();

      const normalizedTargetSchools =
        resolvedTargetSchools && resolvedTargetSchools.length > 0
          ? Array.from(new Set(resolvedTargetSchools))
          : null;

      await eventService.updateEvent(event.id, {
        name: values.name,
        description: values.description,
        event_type: values.event_type,
        icon_type: values.icon_type || null,
        start_date: values.start_date,
        end_date: values.end_date,
        target_minutes: values.target_hours ? Number(values.target_hours) * 60 : null,
        challenge_points: values.challenge_points ? Number(values.challenge_points) : null,
        youtube_video_url: values.youtube_video_url || null,
        event_image_url: eventImageState?.url || null,
        event_image_storage_path: eventImageState?.path || null,
        target_schools: normalizedTargetSchools,
        is_assembly: values.is_assembly,
      });

      if (values.shouldCreateBadge) {
        const pointsReward = parseBadgeNumberField(values.badge.points_reward);
        if (typeof pointsReward === "undefined") {
          toast.error("Badge points reward is invalid");
          setSubmitting(false);
          return;
        }

        const badgeCriteria = buildBadgeCriteriaFromValues(values.badge);
        const badgePayload: Partial<AchievementInterface> = {
          name: values.badge.name,
          description: values.badge.description,
          icon_name: values.badge.icon_name,
          points_reward: pointsReward,
          is_active: values.badge.is_active === "true",
          criteria: badgeCriteria,
        };

        const supabaseClient = createSupabaseClient();
        const achievementService = new AchievementService(supabaseClient);

        const imageFields = selectedBadgeImage || {};

        if (event.badge_achievement_id) {
          await achievementService.update(event.badge_achievement_id, {
            ...badgePayload,
            ...imageFields,
          });
        } else {
          const createdBadge = await achievementService.create({
            ...badgePayload,
            ...imageFields,
          });
          await eventService.updateEvent(event.id, { badge_achievement_id: createdBadge.id });
        }
      }

      toast.success("Challenge updated successfully");
      onOpenChange(false);
      onEventUpdated();
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Challenge</DialogTitle>
        </DialogHeader>

        {event && (
          <Formik<EditEventFormValues>
            initialValues={initialValues}
            validationSchema={editEventSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            <EditEventFormFields
              event={event}
              isSuperAdmin={isSuperAdmin}
              sportWaikatoSchoolIds={sportWaikatoSchoolIds}
              viewerSchoolId={viewerSchoolId}
              selectedBadgeImage={selectedBadgeImage}
              setSelectedBadgeImage={setSelectedBadgeImage}
              eventImageState={eventImageState}
              setEventImageState={setEventImageState}
              onOpenChange={onOpenChange}
              handleBadgeImageSelect={handleBadgeImageSelect}
              schools={schools}
              isLoadingSchools={isLoadingSchools}
              isLoadingBadge={isLoadingBadge}
            />
          </Formik>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface EditEventFormFieldsProps {
  event: EventInterface;
  isSuperAdmin: boolean;
  sportWaikatoSchoolIds: string[];
  viewerSchoolId: string | null;
  selectedBadgeImage: BadgeImageSelection | null;
  setSelectedBadgeImage: (selection: BadgeImageSelection | null) => void;
  eventImageState: EventImageState | null;
  setEventImageState: (state: EventImageState | null) => void;
  onOpenChange: (open: boolean) => void;
  handleBadgeImageSelect: (selection: BadgeImageSelection | null) => void;
  schools: SchoolInterface[];
  isLoadingSchools: boolean;
  isLoadingBadge: boolean;
}

function EditEventFormFields({
  event,
  isSuperAdmin,
  sportWaikatoSchoolIds,
  viewerSchoolId,
  selectedBadgeImage,
  setSelectedBadgeImage,
  eventImageState,
  setEventImageState,
  onOpenChange,
  handleBadgeImageSelect,
  schools,
  isLoadingSchools,
  isLoadingBadge,
}: EditEventFormFieldsProps) {
  const { isSubmitting, values, setFieldValue } = useFormikContext<EditEventFormValues>();

  useEffect(() => {
    if (!isSuperAdmin) return;

    const normalizeIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

    const applySelectionIfDifferent = (ids: string[]) => {
      const normalizedIncoming = normalizeIds(ids);
      const current = normalizeIds(values.selected_school_ids);

      if (
        normalizedIncoming.length === current.length &&
        normalizedIncoming.every((id) => current.includes(id))
      ) {
        return;
      }

      setFieldValue("selected_school_ids", normalizedIncoming, false);
    };

    if (values.audience === "creator_school") {
      applySelectionIfDifferent(
        event.target_schools && event.target_schools.length > 0
          ? event.target_schools
          : viewerSchoolId
            ? [viewerSchoolId]
            : [],
      );
    } else if (values.audience === "all_schools") {
      applySelectionIfDifferent([]);
    } else if (values.audience === "sport_waikato") {
      applySelectionIfDifferent(sportWaikatoSchoolIds);
    }
  }, [
    event.target_schools,
    isSuperAdmin,
    setFieldValue,
    sportWaikatoSchoolIds,
    values.audience,
    values.selected_school_ids,
    viewerSchoolId,
  ]);

  useEffect(() => {
    if (!values.shouldCreateBadge) {
      setSelectedBadgeImage(null);
    }
  }, [values.shouldCreateBadge, setSelectedBadgeImage]);

  const selectedBadgeUrl =
    selectedBadgeImage?.storage_url ||
    (selectedBadgeImage?.image_filename ? `/badges/${selectedBadgeImage.image_filename}` : "");

  return (
    <Form className="space-y-6">
      <div className="space-y-4">
        <FormikInputField
          name="name"
          label="Challenge Name"
          placeholder="Spring Running Challenge"
        />

        <FormikTextareaField
          name="description"
          label="Description"
          placeholder="Describe the challenge, rules, and what participants should expect..."
          rows={4}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormikSelectField
            name="event_type"
            label="Challenge Type"
            onValueChange={(value, { form }) => form.setFieldValue("icon_type", value, false)}
          >
            {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
            <SelectItem value="mixed">Mixed Activities</SelectItem>
          </FormikSelectField>

          <FormikInputField
            name="target_hours"
            label="Target Time (hours, optional)"
            type="number"
            step="0.5"
            placeholder="10"
          />
        </div>

        <EventIconPicker
          value={values.icon_type}
          onChange={(v) => setFieldValue("icon_type", v, false)}
        />

        <div>
          <FormikInputField
            name="challenge_points"
            label="Challenge Points (optional)"
            type="number"
            placeholder="e.g. 50"
          />
          <p className="mt-1 text-xs text-gray-500">
            When set, students earn exactly this many points per activity in this challenge — no
            per-minute calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormikInputField name="start_date" label="Start Date" type="date" />
          <FormikInputField name="end_date" label="End Date" type="date" />
        </div>

        <FormikInputField
          name="youtube_video_url"
          label="YouTube Video URL (Optional)"
          placeholder="https://www.youtube.com/watch?v=..."
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">Challenge Image (Optional)</p>
          <p className="text-xs text-gray-500">
            Upload a banner image displayed on the challenge page.
          </p>
          <EventImageUpload
            key={event.id}
            currentImageUrl={eventImageState?.url}
            onChange={setEventImageState}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">Audience Visibility</h3>
        {isSuperAdmin ? (
          <>
            <FormikSelectField name="audience" label="Who should see this challenge?">
              <SelectItem value="all_schools">All schools</SelectItem>
              <SelectItem value="sport_waikato">Sport Waikato / Internal schools</SelectItem>
              <SelectItem value="custom">Choose specific schools</SelectItem>
              <SelectItem value="creator_school">Only the creating school</SelectItem>
            </FormikSelectField>

            {values.audience === "sport_waikato" && sportWaikatoSchoolIds.length === 0 && (
              <p className="text-sm text-red-600">
                There are no internal schools set up yet. Select a different audience.
              </p>
            )}

            {values.audience === "custom" && (
              <SchoolCheckboxList
                schools={schools}
                selectedIds={values.selected_school_ids}
                isLoading={isLoadingSchools}
                onToggle={(id) => {
                  const current = values.selected_school_ids;
                  setFieldValue(
                    "selected_school_ids",
                    current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
                    false,
                  );
                }}
                emptyMessage="Select at least one school."
              />
            )}
          </>
        ) : (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            This challenge is visible to your school only.
          </div>
        )}
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Assembly Mode</h3>
            <p className="text-sm text-gray-600">
              Feature this challenge in the Assembly Mode presentation for your school.
            </p>
          </div>
          <FormikSwitchField
            name="is_assembly"
            label={values.is_assembly ? "Featured" : "Feature in Assembly"}
          />
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Badge Incentive</h3>
            <p className="text-sm text-gray-600">
              {event.badge_achievement_id
                ? "Edit the badge linked to this challenge."
                : "Create a badge that unlocks when participants complete this challenge."}
            </p>
          </div>
          {isLoadingBadge ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <FormikSwitchField
              name="shouldCreateBadge"
              label={values.shouldCreateBadge ? "Badge enabled" : "Enable badge"}
            />
          )}
        </div>

        {values.shouldCreateBadge && (
          <div className="space-y-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormikInputField
                name="badge.name"
                label="Badge Name"
                placeholder="e.g. Nature Explorer"
              />
              <FormikInputField
                name="badge.icon_name"
                label="Icon Name"
                placeholder="e.g. award, trophy, star"
              />
            </div>

            <FormikTextareaField
              name="badge.description"
              label="Badge Description"
              placeholder="Describe what learners must do to earn this badge..."
              rows={3}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormikInputField
                name="badge.points_reward"
                type="number"
                label="Points Reward"
                placeholder="10"
              />
              <FormikSelectField
                name="badge.is_active"
                label="Badge Status"
                placeholder="Select status"
              >
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </FormikSelectField>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Badge Image (optional)</h4>
              <p className="text-xs text-gray-500">Choose an image from the badge library.</p>
              <BadgeImagePicker selectedUrl={selectedBadgeUrl} onSelect={handleBadgeImageSelect} />
            </div>

            <div className="border-t pt-3">
              <AIBadgeGenerator
                badgeName={values.badge.name}
                badgeDescription={values.badge.description}
                iconContext={values.badge.icon_name}
                onGenerated={(storageUrl, storagePath) => {
                  handleBadgeImageSelect({
                    storage_url: storageUrl,
                    storage_path: storagePath,
                    is_custom_upload: true,
                  });
                }}
                hasExistingImage={!!selectedBadgeImage}
                disabled={!values.badge.name?.trim()}
              />
            </div>

            <BadgeCriteriaBuilder
              values={values.badge}
              setFieldValue={setFieldValue}
              namePrefix="badge"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <SubmitButton isSubmitting={isSubmitting} loadingText="Saving..." className="flex-1">
          Save Changes
        </SubmitButton>
      </div>
    </Form>
  );
}

export default EditEventDialog;
