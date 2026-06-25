import { describe, it, expect } from 'vitest';
import {
  MAX_ACTIVITY_DURATION_MINUTES,
  MAX_ACTIVITY_DAYS_AGO,
  MAX_ACTIVITIES_PER_DAY,
} from '../constants/activityValidationConstants';
import { logActivitySchema } from '@/models/forms/schemas/activitySchemas';

describe('activityValidationConstants', () => {
  it('MAX_ACTIVITY_DURATION_MINUTES is 180', () => expect(MAX_ACTIVITY_DURATION_MINUTES).toBe(180));
  it('MAX_ACTIVITY_DAYS_AGO is 7', () => expect(MAX_ACTIVITY_DAYS_AGO).toBe(7));
  it('MAX_ACTIVITIES_PER_DAY is 3', () => expect(MAX_ACTIVITIES_PER_DAY).toBe(3));
});

describe('logActivitySchema matches server-side constants (drift prevention)', () => {
  const validBase = {
    activity_type: 'walking',
    activity_date: new Date(Date.now() - 60_000), // 1 minute ago, avoids max(new Date()) boundary
    duration_minutes: 60,
    feeling: 'happy',
    participation_type: 'solo',
  };

  it('rejects duration > MAX_ACTIVITY_DURATION_MINUTES', async () => {
    await expect(
      logActivitySchema.validate({ ...validBase, duration_minutes: MAX_ACTIVITY_DURATION_MINUTES + 1 })
    ).rejects.toThrow();
  });

  it('accepts duration === MAX_ACTIVITY_DURATION_MINUTES', async () => {
    await expect(
      logActivitySchema.validate({ ...validBase, duration_minutes: MAX_ACTIVITY_DURATION_MINUTES })
    ).resolves.toBeDefined();
  });

  it('rejects duration of 0', async () => {
    await expect(
      logActivitySchema.validate({ ...validBase, duration_minutes: 0 })
    ).rejects.toThrow();
  });
});
