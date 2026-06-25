import { Formik, Form, useField, Field, useFormikContext } from 'formik';
import { useRouter, useSearch } from '@tanstack/react-router';
import { logActivitySchema } from '@/models/forms/schemas/activitySchemas';
import { useState, useEffect } from 'react';
import { UserInterface } from '@/models/users/interfaces/UserInterface';
import { EventInterface } from '@/models/events/interfaces/EventInterface';
import { ActivityInterface } from '@/models/activities/interfaces/ActivityInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/application/components/DesignSystem/ui/card';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { Badge } from '@/modules/application/components/DesignSystem/ui/badge';
import { SelectItem } from '@/modules/application/components/DesignSystem/ui/select';
import { FormikInputField, FormikSelectField, FormikTextareaField } from '@/modules/common/components/Formik';
import { ACTIVITY_TYPES } from '@/models/activities/interfaces/ActivityInterface';
import { ACTIVITY_CONVERSION_RATES, calculateDistanceFromTime, DEFAULT_POINTS_PER_HOUR } from '@/models/application/constants/applicationConstants';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { ActivityService } from '@/models/activities/services/ActivityService';
import { EventService } from '@/models/events/services/EventService';
import { toast } from 'sonner';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Plus, Minus, User, Users, Zap } from 'lucide-react';
import { FEELING_MAPPINGS } from '@/modules/activities/utils/activityIcons';
import { subDays } from 'date-fns';
import { formatEventDate } from '@/modules/common/utils/dateUtils';
import { format as formatTz, toZonedTime } from 'date-fns-tz';

const NZ_TIMEZONE = 'Pacific/Auckland';

// Utility function to get current NZ date in YYYY-MM-DD format
const getNZDateString = () => {
  const nzDate = toZonedTime(new Date(), NZ_TIMEZONE);
  return formatTz(nzDate, 'yyyy-MM-dd', { timeZone: NZ_TIMEZONE });
};

// Utility function to create NZ timezone date
const createNZDate = (dateString: string) => {
  // Create date at noon NZ time to avoid timezone issues
  return new Date(`${dateString}T12:00:00+12:00`).toISOString();
};

interface LogActivityFormProps {
  user: UserInterface;
  onActivityAdded?: () => void;
  editingActivity?: ActivityInterface;
  onEditComplete?: () => void;
  onCancelEdit?: () => void;
}

// Maps event_type values (from events) to ACTIVITY_TYPES keys
const EVENT_TYPE_TO_ACTIVITY_TYPE: Record<string, string> = {
  running: 'run_jog',
  cycling: 'bike_cycle',
  swimming: 'swimming',
};

const MAX_ACTIVITY_DAYS_AGO = 7;

// Custom duration input with plus/minus buttons
const DurationInput = ({ name, label }: { name: string; label: string }) => {
  const [field, meta, helpers] = useField(name);

  const increment = () => {
    const current = parseInt(field.value) || 0;
    helpers.setValue(current + 1);
  };

  const decrement = () => {
    const current = parseInt(field.value) || 0;
    if (current > 0) {
      helpers.setValue(current - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    helpers.setValue(value);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#0B4B39]">{label}</label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={decrement}
          className="w-8 sm:w-10 md:w-12 h-10 sm:h-12 md:h-[4.5rem] p-0 bg-[#0B4B39]/10 text-[#0B4B39] border-[#0B4B39]/20 hover:bg-[#0B4B39]/20 shrink-0"
          disabled={!field.value || parseInt(field.value) <= 0}
        >
          <Minus size={16} />
        </Button>
        <input
          type="number"
          value={field.value}
          onChange={handleChange}
          onBlur={field.onBlur}
          name={field.name}
          className="flex-1 min-w-0 text-center text-xl sm:text-2xl md:text-3xl font-bold py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-[#0B4B39]/40 focus:outline-none"
          placeholder="60"
          min="0"
        />
        <Button
          type="button"
          onClick={increment}
          className="w-8 sm:w-10 md:w-12 h-10 sm:h-12 md:h-[4.5rem] p-0 bg-[#0B4B39]/10 text-[#0B4B39] border-[#0B4B39]/20 hover:bg-[#0B4B39]/20 shrink-0"
        >
          <Plus size={16} />
        </Button>
      </div>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </div>
  );
};

// Custom participation type selector component
const ParticipationTypeSelector = ({ name, label }: { name: string; label: string }) => {
  const [field, meta, helpers] = useField(name);

  const participationTypes = [
    { value: 'solo', icon: User, label: 'Solo' },
    { value: 'with_others', icon: Users, label: 'With Others' },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#0B4B39]">{label}</label>
      <div className="flex gap-2 sm:gap-3 px-1 sm:px-2 mt-2">
        {participationTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => helpers.setValue(type.value)}
              className={`flex-1 p-2 sm:p-3 rounded-xl border-2 transition-all duration-150 hover:scale-105 ${
                field.value === type.value
                  ? 'border-[#0B4B39] bg-[#0B4B39]/10 scale-105'
                  : 'border-gray-300 hover:border-[#0B4B39]/50'
              }`}
              title={type.label}
            >
              <div className="flex flex-col items-center gap-1">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B4B39]" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">{type.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </div>
  );
};

// Custom emoji feeling selector component
const EmojiFeeling = ({ name, label }: { name: string; label: string }) => {
  const [field, meta, helpers] = useField(name);

  const feelings = Object.entries(FEELING_MAPPINGS).map(([value, mapping]) => ({
    value,
    emoji: (mapping as { emoji: string; label: string }).emoji,
    label: (mapping as { emoji: string; label: string }).label
  }));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#0B4B39]">{label}</label>
      <div className="flex gap-1 sm:gap-2 justify-start">
        {feelings.map((feeling) => (
          <button
            key={feeling.value}
            type="button"
            onClick={() => helpers.setValue(feeling.value)}
            className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-150 hover:scale-110 ${
              field.value === feeling.value
                ? 'border-[#0B4B39] bg-[#0B4B39]/10 scale-110'
                : 'border-gray-300 hover:border-[#0B4B39]/50'
            }`}
            title={feeling.label}
          >
            <span className="text-xl sm:text-2xl">{feeling.emoji}</span>
          </button>
        ))}
      </div>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </div>
  );
};

// Challenge Selection component
const ChallengeSelector = ({ name, label, challenges }: { name: string; label: string; challenges: EventInterface[] }) => {
  const [field, meta, helpers] = useField(name);
  const { setFieldValue } = useFormikContext<any>();

  const handleSelectChallenge = (challenge: EventInterface) => {
    helpers.setValue(challenge.id);
    const mappedType = EVENT_TYPE_TO_ACTIVITY_TYPE[challenge.event_type];
    if (mappedType) {
      setFieldValue('activity_type', mappedType);
    }
  };

  const handleSelectGeneral = () => {
    helpers.setValue('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#0B4B39]">{label}</label>
      <div className="space-y-3">
        {/* Option for no challenge */}
        <button
          type="button"
          onClick={handleSelectGeneral}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-150 text-left ${
            !field.value
              ? 'border-[#0B4B39] bg-[#0B4B39]/10'
              : 'border-gray-300 hover:border-[#0B4B39]/50 bg-[#0B4B39]/5'
          }`}
        >
          <div>
            <p className="font-semibold text-gray-800">General Activity</p>
            <p className="text-sm text-gray-500">Log without challenge (1x points)</p>
          </div>
        </button>

        {/* Challenge options */}
        {challenges.map((challenge) => (
          <button
            key={challenge.id}
            type="button"
            onClick={() => handleSelectChallenge(challenge)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-150 text-left ${
              field.value === challenge.id
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-300 hover:border-[#0B4B39]/50 bg-[#0B4B39]/5'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-800">{challenge.name}</p>
                {challenge.challenge_points ? (
                  <Badge className="bg-yellow-500 text-black text-xs">
                    <Zap size={12} className="mr-1" />
                    {challenge.challenge_points} pts
                  </Badge>
                ) : challenge.points_multiplier && challenge.points_multiplier > 1 ? (
                  <Badge className="bg-yellow-500 text-black text-xs">
                    <Zap size={12} className="mr-1" />
                    {challenge.points_multiplier}x Points!
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-gray-600 truncate">{challenge.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Until {formatEventDate(challenge.end_date, 'MMM d')}
              </p>
            </div>
          </button>
        ))}

        {challenges.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <p>No active challenges available.</p>
            <p className="text-sm">Join challenges from the Events page!</p>
          </div>
        )}
      </div>
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm">{meta.error}</div>
      )}
    </div>
  );
};

const LogActivityForm = ({ user, onActivityAdded, editingActivity, onEditComplete, onCancelEdit }: LogActivityFormProps) => {
  const router = useRouter();
  const searchParams = useSearch({ strict: false });
  const [challenges, setChallenges] = useState<EventInterface[]>([]);
  const [preselectedChallengeId, setPreselectedChallengeId] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const eventService = new EventService(createSupabaseClient());
        const activeChallenges = await eventService.getApprovedEvents({
          viewerRole: user.role,
          viewerSchoolId: user.school_id,
        });
        
        // Filter to only show events user is participating in and are currently active
        const userParticipation = await eventService.getUserEventParticipation(user.id);
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const availableChallenges = activeChallenges.filter(event => {
          const isParticipating = userParticipation.includes(event.id);
          const isActive = event.start_date <= todayStr && event.end_date >= todayStr;
          return isParticipating && isActive;
        });
        
        setChallenges(availableChallenges);
        
        // Check for pre-selected challenge from URL
        const challengeFromUrl = searchParams.get('challenge');
        if (challengeFromUrl && availableChallenges.some(c => c.id === challengeFromUrl)) {
          setPreselectedChallengeId(challengeFromUrl);
        }
      } catch (error) {
        notifyAboutError(error);
      }
    };

    loadChallenges();
  }, [user.id, searchParams]);

  const calculateDistance = (activityType: string, durationMinutes: number): number => {
    return calculateDistanceFromTime(activityType as keyof typeof ACTIVITY_CONVERSION_RATES, durationMinutes);
  };

  const handleSubmit = async (values: any, { resetForm }: any) => {
    try {
      const supabase = createSupabaseClient();
      const activityService = new ActivityService(supabase);
      
      const finalDistance = calculateDistance(values.activity_type, Number(values.duration_minutes));
      
      const customActivityName = values.activity_type === 'something_else'
        ? values.custom_activity_name?.trim() || ''
        : null;

      if (editingActivity) {
        // Update existing activity
        const activityData = {
          activity_type: values.activity_type,
          duration_minutes: Number(values.duration_minutes),
          distance_km: finalDistance,
          feeling: values.feeling,
          participation_type: values.participation_type,
          description: values.description,
          event_id: values.event_id || null,
          custom_activity_name: customActivityName,
          created_at: values.activity_date !== getNZDateString() 
            ? createNZDate(values.activity_date)
            : undefined,
        };

        await activityService.update(editingActivity.id, user.id, activityData);

        toast.success('Activity updated successfully!');
        
        if (onEditComplete) {
          onEditComplete();
        }
      } else {
        // Create new activity
        const activityData = {
          activity_type: values.activity_type,
          duration_minutes: Number(values.duration_minutes),
          distance_km: finalDistance,
          feeling: values.feeling,
          participation_type: values.participation_type,
          description: values.description,
          input_type: 'time' as const,
          user_id: user.id,
          event_id: values.event_id || null,
          custom_activity_name: customActivityName,
          created_at: values.activity_date !== getNZDateString() 
            ? createNZDate(values.activity_date)
            : undefined,
        };

        await activityService.create(activityData);

        const loggedChallenge = challenges.find(c => c.id === values.event_id);
        if (loggedChallenge?.challenge_points) {
          toast.success(`Activity logged! Earned ${loggedChallenge.challenge_points} points for ${loggedChallenge.name}!`);
        } else if (loggedChallenge?.points_multiplier && loggedChallenge.points_multiplier > 1) {
          toast.success(`Activity logged! Earned ${loggedChallenge.points_multiplier}x points for ${loggedChallenge.name}!`);
        } else {
          toast.success('Activity logged successfully!');
        }

        resetForm();
        
        if (onActivityAdded) {
          onActivityAdded();
        }
      }
      
      router.invalidate();
    } catch (error) {
      notifyAboutError(error);
    }
  };

  return (
    <Card
      className="shadow-sm rounded-2xl border border-gray-200"
      style={{ backgroundColor: '#f9fefd' }}
    >
      <CardHeader>
        <CardTitle className="text-[#0B4B39]">
          {editingActivity ? 'Edit Activity' : 'Log Activity'}
        </CardTitle>
        <p className="text-gray-600">
          {editingActivity ? 'Update your activity details' : 'Record the time you spent being active'}
        </p>
      </CardHeader>
      <CardContent>
        <Formik
          initialValues={{
            activity_type: editingActivity?.activity_type || 'run_jog',
            activity_date: editingActivity
              ? formatTz(toZonedTime(new Date(editingActivity.created_at), NZ_TIMEZONE), 'yyyy-MM-dd', { timeZone: NZ_TIMEZONE })
              : getNZDateString(),
            duration_minutes: editingActivity?.duration_minutes || 0,
            feeling: editingActivity?.feeling || '',
            participation_type: editingActivity?.participation_type || 'solo',
            description: editingActivity?.description || '',
            event_id: editingActivity?.event_id || preselectedChallengeId || '',
            custom_activity_name: editingActivity?.custom_activity_name || '',
          }}
          validationSchema={logActivitySchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => {
            const preselectedChallengeId = challenges.find(c => c.id === values.event_id);
            const lockedActivityType = preselectedChallengeId
              ? EVENT_TYPE_TO_ACTIVITY_TYPE[preselectedChallengeId.event_type]
              : null;

            return (
            <Form className="space-y-4 [&_label]:text-[#0B4B39] [&_input]:bg-white [&_input]:text-gray-900 [&_input]:border-gray-300 [&_input:focus]:border-[#0B4B39]/40 [&_input::placeholder]:text-gray-400 [&_textarea]:bg-white [&_textarea]:text-gray-900 [&_textarea]:border-gray-300 [&_textarea:focus]:border-[#0B4B39]/40 [&_textarea::placeholder]:text-gray-400 [&_button[role=combobox]]:bg-white [&_button[role=combobox]]:text-gray-900 [&_button[role=combobox]]:border-gray-300 [&_button[role=combobox]:hover]:border-[#0B4B39]/40">
              <ChallengeSelector
                name="event_id"
                label="Challenge (Optional)"
                challenges={challenges}
              />

              {lockedActivityType ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[#0B4B39]">Activity Type</label>
                  <div className="w-full py-2 px-3 bg-[#0B4B39]/10 text-[#0B4B39] border border-[#0B4B39]/20 rounded-lg">
                    {ACTIVITY_TYPES[lockedActivityType as keyof typeof ACTIVITY_TYPES]}
                  </div>
                  <p className="text-xs text-gray-400">Activity type set by challenge</p>
                </div>
              ) : (
                <FormikSelectField
                  name="activity_type"
                  label="Activity Type"
                  onValueChange={(value, { form }) => {
                    if (value !== 'something_else') {
                      form.setFieldValue('custom_activity_name', '');
                    }
                  }}
                >
                  {Object.entries(ACTIVITY_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </FormikSelectField>
              )}

              {values.activity_type === 'something_else' && (
                <FormikInputField
                  name="custom_activity_name"
                  label="What activity did you do?"
                  placeholder="Describe your activity"
                />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0B4B39]">Activity Date</label>
                <Field name="activity_date">
                  {({ field, meta }: any) => (
                    <div>
                      <input
                        {...field}
                        type="date"
                        min={formatTz(toZonedTime(subDays(new Date(), MAX_ACTIVITY_DAYS_AGO), NZ_TIMEZONE), 'yyyy-MM-dd', { timeZone: NZ_TIMEZONE })}
                        max={getNZDateString()}
                        className="w-full py-2 px-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-[#0B4B39]/40 focus:outline-none"
                      />
                      {meta.touched && meta.error && (
                        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
                      )}
                    </div>
                  )}
                </Field>
              </div>

              {/* Only time input */}
              <div className="space-y-4">
                <DurationInput
                  name="duration_minutes"
                  label="Duration (minutes)"
                />
                {values.duration_minutes > 0 && values.activity_type && (
                  <div className="p-3 bg-[#0B4B39]/5 border border-gray-200 rounded-md space-y-1">
                    {(() => {
                      const basePoints = Number(values.duration_minutes);
                      const selectedChallenge = challenges.find(c => c.id === values.event_id);

                      if (selectedChallenge?.challenge_points) {
                        return (
                          <p className="text-sm text-gray-700">
                            <strong className="text-[#0B4B39]">Points:</strong> {selectedChallenge.challenge_points} (fixed challenge reward)
                          </p>
                        );
                      }

                      if (selectedChallenge?.points_multiplier && selectedChallenge.points_multiplier > 1) {
                        const finalPoints = Math.round(basePoints * selectedChallenge.points_multiplier);
                        return (
                          <>
                            <p className="text-sm text-gray-700">
                              <strong className="text-[#0B4B39]">Your Points:</strong> {finalPoints} ({selectedChallenge.points_multiplier}x challenge bonus)
                            </p>
                            <p className="text-sm text-gray-500">House Points: {basePoints}</p>
                          </>
                        );
                      }

                      return (
                        <p className="text-sm text-gray-700">
                          <strong className="text-[#0B4B39]">Points:</strong> {basePoints}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>

              <EmojiFeeling
                name="feeling"
                label="How did you feel?"
              />

              <ParticipationTypeSelector
                name="participation_type"
                label="Participation Type"
              />

              <FormikTextareaField
                name="description"
                label="Notes (optional)"
                placeholder="Add any details about your activity..."
                rows={3}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={editingActivity ? onCancelEdit : undefined}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 text-white"
                  style={{ backgroundColor: '#0B4B39' }}
                >
                  {isSubmitting
                    ? (editingActivity ? 'Updating...' : 'Logging...')
                    : (editingActivity ? 'Update Activity' : 'Log Activity')
                  }
                </Button>
              </div>
            </Form>
            );
          }}
        </Formik>
      </CardContent>
    </Card>
  );
};

export default LogActivityForm; 
