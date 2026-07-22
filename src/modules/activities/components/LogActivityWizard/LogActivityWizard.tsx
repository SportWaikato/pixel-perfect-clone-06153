import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { UserInterface } from "@/models/users/interfaces/UserInterface";
import { EventInterface } from "@/models/events/interfaces/EventInterface";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";
import { ActivityService } from "@/models/activities/services/ActivityService";
import { EventService } from "@/models/events/services/EventService";
import { StorageService } from "@/models/storage/services/StorageService";
import {
  calculateDistanceFromTime,
  ACTIVITY_CONVERSION_RATES,
} from "@/models/application/constants/applicationConstants";
import { notifyAboutError } from "@/modules/application/utils/notifyAboutError";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { ChevronLeft } from "lucide-react";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { useRouter } from "@tanstack/react-router";
import { WizardState, EVENT_TYPE_TO_ACTIVITY_TYPE } from "./types";
import StepProgress from "./StepProgress";
import Step1Challenge from "./Step1Challenge";
import Step2ActivityType from "./Step2ActivityType";
import Step3DateDuration from "./Step3DateDuration";
import Step4Feedback from "./Step4Feedback";
import Step5Confirm from "./Step5Confirm";
import Step6Success from "./Step6Success";
import { m, AnimatePresence } from "framer-motion";
import { squishyTap } from "@/modules/application/components/animations/tactile";

const NZ_TIMEZONE = "Pacific/Auckland";

const getNZDateString = () => {
  const nzDate = toZonedTime(new Date(), NZ_TIMEZONE);
  return formatTz(nzDate, "yyyy-MM-dd", { timeZone: NZ_TIMEZONE });
};

const createNZDate = (dateString: string) => new Date(`${dateString}T12:00:00+12:00`).toISOString();

interface LogActivityWizardProps {
  user: UserInterface;
  initialChallenges: EventInterface[];
  onActivityAdded?: () => void;
}

const defaultState = (): WizardState => ({
  eventId: "",
  activityType: "run_jog",
  customActivityName: "",
  activityDate: getNZDateString(),
  durationMinutes: 0,
  feeling: "",
  participationType: "solo",
  notes: "",
  proofImageFile: null,
});

const LogActivityWizard = ({
  user,
  initialChallenges,
  onActivityAdded,
}: LogActivityWizardProps) => {
  const router = useRouter();
  const searchParams = useSearch({ strict: false });
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(defaultState);
  const [challenges] = useState<EventInterface[]>(initialChallenges);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [succeeded, setSucceeded] = useState(false);
  const [challengePreselected, setChallengePreselected] = useState(false);

  useEffect(() => {
    const challengeFromUrl = (searchParams as { challenge?: string }).challenge;
    if (challengeFromUrl && challenges.some((c) => c.id === challengeFromUrl)) {
      const found = challenges.find((c) => c.id === challengeFromUrl);
      const locked = found ? EVENT_TYPE_TO_ACTIVITY_TYPE[found.event_type ?? ""] : null;
      setData((prev) => ({
        ...prev,
        eventId: challengeFromUrl,
        activityType: locked || prev.activityType,
      }));
      setChallengePreselected(true);
      setStep(locked ? 3 : 2);
    }
  }, [challenges, searchParams]);

  const update = (updates: Partial<WizardState>) => setData((prev) => ({ ...prev, ...updates }));

  const getLockedActivityType = () => {
    const selectedChallenge = challenges.find((c) => c.id === data.eventId);
    return selectedChallenge
      ? (EVENT_TYPE_TO_ACTIVITY_TYPE[selectedChallenge.event_type] ?? null)
      : null;
  };

  const canAdvance = () => {
    if (step === 2 && !data.activityType) return false;
    if (step === 3 && (!data.activityDate || data.durationMinutes <= 0)) return false;
    if (step === 4 && !data.feeling) return false;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (step === 1) {
      const lockedType = getLockedActivityType();
      if (lockedType) {
        update({ activityType: lockedType });
        setStep(3);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    if (challengePreselected && step === 2) {
      window.history.back();
      return;
    }
    if (step === 3 && getLockedActivityType()) {
      if (challengePreselected) {
        window.history.back();
      } else {
        setStep(1);
      }
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createSupabaseClient();
      const activityService = new ActivityService(supabase);
      const eventService = new EventService(supabase);

      if (data.eventId) {
        await eventService.joinEvent(data.eventId, user.id);
      }
      const selectedChallenge = challenges.find((c) => c.id === data.eventId);
      const lockedType = selectedChallenge
        ? EVENT_TYPE_TO_ACTIVITY_TYPE[selectedChallenge.event_type]
        : null;
      const finalType = lockedType || data.activityType;

      const distance = calculateDistanceFromTime(
        finalType as keyof typeof ACTIVITY_CONVERSION_RATES,
        data.durationMinutes,
      );

      const pts = (() => {
        if (selectedChallenge?.challenge_points) return selectedChallenge.challenge_points;
        if (selectedChallenge?.points_multiplier && selectedChallenge.points_multiplier > 1) {
          return Math.round(data.durationMinutes * selectedChallenge.points_multiplier);
        }
        return data.durationMinutes;
      })();
      setPointsEarned(pts);

      let proofUrl: string | undefined;
      let proofPath: string | undefined;
      if (data.proofImageFile) {
        const storageService = new StorageService(supabase);
        const uploaded = await storageService.uploadActivityProofImage(data.proofImageFile);
        proofUrl = uploaded.storage_url;
        proofPath = uploaded.storage_path;
      }

      await activityService.create({
        activity_type: finalType,
        duration_minutes: data.durationMinutes,
        distance_km: distance,
        feeling: data.feeling as "happy" | "average" | "sad",
        participation_type: data.participationType,
        description: data.notes,
        input_type: "time",
        user_id: user.id,
        event_id: data.eventId || undefined,
        custom_activity_name:
          data.activityType === "something_else"
            ? data.customActivityName.trim() || undefined
            : undefined,
        created_at:
          data.activityDate !== getNZDateString() ? createNZDate(data.activityDate) : undefined,
        proof_image_url: proofUrl,
        proof_image_storage_path: proofPath,
      });

      setSucceeded(true);
      onActivityAdded?.();
      router.invalidate();
    } catch (error) {
      console.error("LogActivityWizard submit error:", error);
      notifyAboutError(error);
      setIsSubmitting(false);
    }
  };

  const handleLogAnother = () => {
    setData(defaultState());
    setStep(1);
    setSucceeded(false);
  };

  return (
    <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: "#f8fefc" }}>
      {succeeded ? (
        <Step6Success user={user} pointsEarned={pointsEarned} onLogAnother={handleLogAnother} />
      ) : (
        <>
          <StepProgress currentStep={step} />

          <AnimatePresence mode="wait">
            <m.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step === 1 && (
                <Step1Challenge data={data} challenges={challenges} onChange={update} />
              )}
              {step === 2 && (
                <Step2ActivityType data={data} challenges={challenges} onChange={update} />
              )}
              {step === 3 && (
                <Step3DateDuration data={data} challenges={challenges} onChange={update} />
              )}
              {step === 4 && <Step4Feedback data={data} onChange={update} />}
              {step === 5 && (
                <Step5Confirm
                  data={data}
                  challenges={challenges}
                  user={user}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  onUpdate={update}
                />
              )}
            </m.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex flex-col gap-3 mt-8">
            {step < 5 && (
              <m.div {...squishyTap}>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="w-full rounded-xl py-3 font-bold"
                  style={{ backgroundColor: "#1B5E4B", color: "white" }}
                >
                  Next
                </Button>
              </m.div>
            )}
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full gap-1.5 rounded-xl border-2 px-4"
              >
                <ChevronLeft size={16} />
                Back
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LogActivityWizard;
