import { object, string, number, boolean, mixed, array, type Schema } from 'yup';
import { isValidYouTubeUrl } from '@/modules/events/utils/youtubeUtils';
import {
  type BadgeFormValues,
  badgeFormValidationSchema,
  getInitialBadgeFormValues,
} from '@/modules/admin/components/badges/badgeCriteriaHelpers';

export type EventAudienceOption = 'creator_school' | 'all_schools' | 'sport_waikato' | 'custom';

const buildDefaultBadgeSchema = () =>
  (
    mixed<BadgeFormValues>()
      .transform(() => getInitialBadgeFormValues(null))
      .default(getInitialBadgeFormValues(null)) as unknown
  ) as Schema<BadgeFormValues>;

export const eventBaseSchema = object({
  name: string().required('Event name is required'),
  description: string().required('Description is required'),
  event_type: string().required('Event type is required'),
  start_date: string().required('Start date is required'),
  end_date: string()
    .required('End date is required')
    .test('end-after-start', 'End date must be on or after start date', function (value) {
      const { start_date } = this.parent as { start_date: string };
      if (!value || !start_date) return true;
      return new Date(value) >= new Date(start_date);
    }),
  target_hours: number()
    .typeError('Enter a valid number')
    .positive('Target hours must be positive')
    .nullable()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null || typeof originalValue === 'undefined') {
        return null;
      }
      return value;
    })
    .default(null),
  challenge_points: number()
    .typeError('Enter a valid number')
    .integer('Must be a whole number')
    .min(1, 'Points must be at least 1')
    .nullable()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue === null || typeof originalValue === 'undefined') {
        return null;
      }
      return value;
    })
    .default(null),
  youtube_video_url: string()
    .transform(value => value ?? '')
    .default('')
    .test('youtube-url', 'Please enter a valid YouTube URL', value => isValidYouTubeUrl(value || '')),
  audience: mixed<EventAudienceOption>()
    .oneOf(['creator_school', 'all_schools', 'sport_waikato', 'custom'])
    .default('creator_school'),
  selected_school_ids: array()
    .of(string().uuid('Invalid school selection'))
    .default([])
    .when('audience', {
      is: (audience: EventAudienceOption) => audience === 'custom',
      then: schema => schema.min(1, 'Select at least one school'),
      otherwise: schema => schema,
    }),
});

export const editEventSchema = eventBaseSchema.shape({
  is_assembly: boolean().default(false),
  shouldCreateBadge: boolean().default(false),
  badge: mixed<BadgeFormValues>()
    .when('shouldCreateBadge', {
      is: true,
      then: () => badgeFormValidationSchema as unknown as Schema<BadgeFormValues>,
      otherwise: () => buildDefaultBadgeSchema(),
    }),
});

export const createEventSchema = eventBaseSchema.shape({
  is_assembly: boolean().default(false),
  shouldCreateBadge: boolean().default(false),
  badge: mixed<BadgeFormValues>()
    .when('shouldCreateBadge', {
      is: true,
      then: () => badgeFormValidationSchema as unknown as Schema<BadgeFormValues>,
      otherwise: () => buildDefaultBadgeSchema(),
    }),
});
