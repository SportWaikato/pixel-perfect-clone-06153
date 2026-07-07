import { useEffect, useMemo, useState } from "react";
import { Formik, Form, FormikProps } from "formik";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { createEventSchema, EventAudienceOption } from "@/models/forms/schemas/eventSchemas";
import { ACTIVITY_TYPES } from "@/models/activities/interfaces/ActivityInterface";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/application/components/DesignSystem/ui/dialog";
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
import {
  isSuperAdmin as checkIsSuperAdmin,
  isAdmin as checkIsAdmin,
} from "@/modules/auth/utils/roleUtils";
import { AchievementInterface } from "@/models/achievements/interfaces/AchievementInterface";
import { toast } from "sonner";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import BadgeImagePicker, {
  BadgeImageSelection,
} from "@/modules/admin/components/badges/BadgeImagePicker";
import { BadgeImageHelper } from "@/models/achievements/helpers/BadgeImageHelper";
import AIBadgeGenerator from "@/modules/admin/components/badges/AIBadgeGenerator";
import BadgeCriteriaBuilder from "@/modules/admin/components/badges/BadgeCriteriaBuilder";
import {
  type BadgeFormValues,
  buildBadgeCriteriaFromValues,
  getInitialBadgeFormValues,
  parseBadgeNumberField,
} from "@/modules/admin/components/badges/badgeCriteriaHelpers";
import { SchoolService } from "@/models/schools/services/SchoolService";
import { SchoolInterface } from "@/models/schools/interfaces/SchoolInterface";
import EventIconPicker from "@/modules/admin/components/EventIconPicker";
import SchoolCheckboxList from "@/modules/admin/components/SchoolCheckboxList";
import SubmitButton from "@/modules/admin/components/SubmitButton";
import EventImageUpload, { EventImageState } from "@/modules/admin/components/EventImageUpload";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserInterface;
  onEventCreated: () => void;
}

interface CreateEventFormValues {
  name: string;
  description: string;
  event_type: string;
  icon_type: string;
  start_date: string;
  end_date: string;
  target_hours: number | null | undefined;
  challenge_points: number | null | undefined;
  youtube_video_url: string;
  is_assembly: boolean;
  shouldCreateBadge: boolean;
  badge: BadgeFormValues;
  audience: EventAudienceOption;
  selected_school_ids: string[];
}

interface CreateEventFormInnerProps {
  isSubmitting: boolean;
  values: CreateEventFormValues;
  setFieldValue: FormikProps<CreateEventFormValues>["setFieldValue"];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  creatorSchoolId: string | null | undefined;
  sportWaikatoSchoolIds: string[];
  isLoadingSchools: boolean;
  schools: SchoolInterface[];
  selectedBadgeUrl: string;
  onBadgeImageSelect: (selection: BadgeImageSelection | null) => void;
  eventImageUrl: string;
  onEventImageChange: (image: EventImageState | null) => void;
  onCancel: () => void;
  onIconChange: (value: string) => void;
}

const CreateEventFormInner = ({
  isSubmitting,
  values,
  setFieldValue,
  isSuperAdmin,
  isAdmin,
  creatorSchoolId,
  sportWaikatoSchoolIds,
  isLoadingSchools,
  schools,
  selectedBadgeUrl,
  onBadgeImageSelect,
  eventImageUrl,
  onEventImageChange,
  onCancel,
  onIconChange,
}: CreateEventFormInnerProps) => {
  useEffect(() => {
    if (!values.shouldCreateBadge) {
      setFieldValue("badge", getInitialBadgeFormValues(null), false);
      onBadgeImageSelect(null);
    }
  }, [values.shouldCreateBadge, setFieldValue, onBadgeImageSelect]);

  useEffect(() => {
    const normalizeIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

    if (!isSuperAdmin) {
      const enforcedIds = creatorSchoolId ? [creatorSchoolId] : [];
      const current = normalizeIds(values.selected_school_ids);
      if (
        enforcedIds.length !== current.length ||
        enforcedIds.some((id) => !current.includes(id))
      ) {
        setFieldValue("selected_school_ids", enforcedIds, false);
      }
      return;
    }

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
      applySelectionIfDifferent(creatorSchoolId ? [creatorSchoolId] : []);
    } else if (values.audience === "all_schools") {
      applySelectionIfDifferent([]);
    } else if (values.audience === "sport_waikato") {
      applySelectionIfDifferent(sportWaikatoSchoolIds);
    }
  }, [
    creatorSchoolId,
    isSuperAdmin,
    setFieldValue,
    sportWaikatoSchoolIds,
    values.audience,
    values.selected_school_ids,
  ]);

  return (
    <Form className="space-y-6 pb-2">
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

        {isAdmin && <EventIconPicker value={values.icon_type} onChange={onIconChange} />}

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
          <EventImageUpload currentImageUrl={eventImageUrl} onChange={onEventImageChange} />
        </div>

        {values.target_hours && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Challenge Target:</strong> {values.target_hours} hours total activity time
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Students work together to reach this goal during the event period.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-medium">Audience Visibility</h3>
        <p className="text-sm text-gray-600">
          Decide which schools can view and participate in this challenge.
        </p>

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
            This challenge will only be visible to your school.
          </div>
        )}
      </div>

      {isAdmin && (
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
      )}

      {isAdmin && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Add Badge Incentive</h3>
              <p className="text-sm text-gray-600">
                Create a badge that unlocks when participants complete this challenge.
              </p>
            </div>
            <FormikSwitchField
              name="shouldCreateBadge"
              label={values.shouldCreateBadge ? "Badge enabled" : "Enable badge"}
            />
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
                <BadgeImagePicker selectedUrl={selectedBadgeUrl} onSelect={onBadgeImageSelect} />
              </div>

              <div className="border-t pt-3">
                <AIBadgeGenerator
                  badgeName={values.badge.name}
                  badgeDescription={values.badge.description}
                  iconContext={values.badge.icon_name}
                  onGenerated={(storageUrl, storagePath) => {
                    onBadgeImageSelect({
                      storage_url: storageUrl,
                      storage_path: storagePath,
                      is_custom_upload: true,
                    });
                  }}
                  hasExistingImage={!!selectedBadgeUrl}
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
      )}

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <SubmitButton isSubmitting={isSubmitting} loadingText="Creating..." className="flex-1">
          {values.shouldCreateBadge ? "Create Challenge & Badge" : "Create Challenge"}
        </SubmitButton>
      </div>
    </Form>
  );
};

const CreateEventDialog = ({
  open,
  onOpenChange,
  user,
  onEventCreated,
}: CreateEventDialogProps) => {
  const [selectedBadgeImage, setSelectedBadgeImage] = useState<BadgeImageSelection | null>(null);
  const [selectedEventImage, setSelectedEventImage] = useState<EventImageState | null>(null);
  const [schools, setSchools] = useState<SchoolInterface[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  const isSuperAdmin = checkIsSuperAdmin(user);
  const isAdmin = checkIsAdmin(user);
  const creatorSchoolId = user.school_id;

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

  const initialValues: CreateEventFormValues = {
    name: "",
    description: "",
    event_type: "mixed",
    icon_type: "",
    start_date: "",
    end_date: "",
    target_hours: null,
    challenge_points: null,
    youtube_video_url: "",
    is_assembly: false,
    shouldCreateBadge: false,
    badge: getInitialBadgeFormValues(null),
    audience: isSuperAdmin ? "all_schools" : "creator_school",
    selected_school_ids: creatorSchoolId ? [creatorSchoolId] : [],
  };

  const handleBadgeImageSelect = (selection: BadgeImageSelection | null) => {
    setSelectedBadgeImage(selection);
  };

  const handleSubmit = async (values: CreateEventFormValues, { resetForm, setSubmitting }: any) => {
    try {
      const supabaseClient = createSupabaseClient();
      const eventService = new EventService(supabaseClient);
      const achievementService = new AchievementService(supabaseClient);

      const resolvedTargetSchools = (() => {
        if (!isSuperAdmin) {
          return creatorSchoolId ? [creatorSchoolId] : null;
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
            return creatorSchoolId ? [creatorSchoolId] : [];
        }
      })();

      if (
        values.audience === "sport_waikato" &&
        isSuperAdmin &&
        sportWaikatoSchoolIds.length === 0
      ) {
        toast.error(
          "No internal (Sport Waikato) schools are configured yet. Please choose another audience.",
        );
        setSubmitting(false);
        return;
      }

      const normalizedTargetSchools =
        resolvedTargetSchools && resolvedTargetSchools.length > 0
          ? Array.from(new Set(resolvedTargetSchools))
          : null;

      const eventData = {
        name: values.name,
        description: values.description,
        event_type: values.event_type,
        icon_type: values.icon_type || null,
        start_date: values.start_date,
        end_date: values.end_date,
        target_minutes: values.target_hours ? Number(values.target_hours) * 60 : undefined,
        challenge_points: values.challenge_points ? Number(values.challenge_points) : null,
        target_schools: normalizedTargetSchools,
        youtube_video_url: values.youtube_video_url || undefined,
        event_image_url: selectedEventImage?.url || null,
        event_image_storage_path: selectedEventImage?.path || null,
        is_assembly: values.is_assembly,
      };

      const createdEvent = isAdmin
        ? await eventService.createApprovedEvent(eventData, user.id)
        : await eventService.createPendingEvent(eventData, user.id);

      const createdEventId = createdEvent.id;

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

        const createdBadge = await achievementService.create({
          ...badgePayload,
          ...(selectedBadgeImage || {}),
        });

        await eventService.updateEvent(createdEventId, {
          badge_achievement_id: createdBadge.id,
        });
      }

      resetForm();
      setSelectedBadgeImage(null);
      setSelectedEventImage(null);
      onOpenChange(false);
      onEventCreated();

      const successMessage = values.shouldCreateBadge
        ? isAdmin
          ? "Challenge and badge created and published successfully!"
          : "Challenge and badge submitted for approval!"
        : isAdmin
          ? "Challenge created and published successfully!"
          : "Challenge submitted for approval!";

      toast.success(successMessage);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-h-[90vh] overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-6 space-y-6">
          <DialogHeader className="px-0 pt-0">
            <DialogTitle>Create New Challenge</DialogTitle>
          </DialogHeader>

          <Formik<CreateEventFormValues>
            initialValues={initialValues}
            validationSchema={createEventSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <CreateEventFormInner
                isSubmitting={isSubmitting}
                values={values}
                setFieldValue={setFieldValue}
                isSuperAdmin={isSuperAdmin}
                isAdmin={isAdmin}
                creatorSchoolId={creatorSchoolId}
                sportWaikatoSchoolIds={sportWaikatoSchoolIds}
                isLoadingSchools={isLoadingSchools}
                schools={schools}
                selectedBadgeUrl={
                  selectedBadgeImage ? BadgeImageHelper.getBadgeImageUrl(selectedBadgeImage) : ""
                }
                onBadgeImageSelect={handleBadgeImageSelect}
                eventImageUrl={selectedEventImage?.url || ""}
                onEventImageChange={setSelectedEventImage}
                onCancel={() => onOpenChange(false)}
                onIconChange={(v) => setFieldValue("icon_type", v, false)}
              />
            )}
          </Formik>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
