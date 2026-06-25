import { describe, it, expect } from 'vitest';
import { getUserDisplayName, getDisplayUser, isUserPublic } from './privacyUtils';
import { UserInterface } from '@/models/users/interfaces/UserInterface';

const baseUser: UserInterface = {
  id: 'u1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  username: 'jsmith',
  first_name: 'Jane',
  last_name: 'Smith',
  school_id: 'school-1',
  is_admin: false,
  is_active: true,
  is_public: true,
  role: 'student',
  total_minutes: 0,
  monthly_goal_minutes: 0,
  total_points: 0,
  total_kilometers: 0,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  school_rank: null,
  house_rank: null,
  year_group_rank: null,
  overall_rank: null,
};

describe('getUserDisplayName', () => {
  it('returns "Anonymous User" for private user regardless of name fields', () => {
    expect(getUserDisplayName({ ...baseUser, is_public: false })).toBe('Anonymous User');
  });

  it('returns full name for public user with both names', () => {
    expect(getUserDisplayName(baseUser)).toBe('Jane Smith');
  });

  it('returns username when public user has no first/last name', () => {
    expect(getUserDisplayName({ ...baseUser, first_name: '', last_name: '' })).toBe('jsmith');
  });

  it('returns "Unknown User" when public user has no name or username', () => {
    expect(getUserDisplayName({ ...baseUser, first_name: '', last_name: '', username: '' })).toBe('Unknown User');
  });
});

describe('getDisplayUser', () => {
  it('returns public user unchanged', () => {
    const result = getDisplayUser(baseUser);
    expect(result).toEqual(baseUser);
  });

  it('anonymizes username, first_name, last_name for private user', () => {
    const result = getDisplayUser({ ...baseUser, is_public: false });
    expect(result.username).toBe('Anonymous');
    expect(result.first_name).toBe('Anonymous');
    expect(result.last_name).toBe('User');
  });

  it('sets social_handle and profile_icon_url to undefined for private user', () => {
    const result = getDisplayUser({
      ...baseUser,
      is_public: false,
      social_handle: '@jsmith',
      profile_icon_url: 'https://example.com/avatar.png',
    });
    expect(result.social_handle).toBeUndefined();
    expect(result.profile_icon_url).toBeUndefined();
  });

  it('preserves non-identity fields (id, school_id, total_points) for private user', () => {
    const result = getDisplayUser({ ...baseUser, is_public: false, total_points: 500, school_id: 'school-99' });
    expect(result.id).toBe('u1');
    expect(result.school_id).toBe('school-99');
    expect(result.total_points).toBe(500);
  });
});

describe('isUserPublic', () => {
  it('returns true when is_public is true', () => {
    expect(isUserPublic({ ...baseUser, is_public: true })).toBe(true);
  });

  it('returns false when is_public is false', () => {
    expect(isUserPublic({ ...baseUser, is_public: false })).toBe(false);
  });

  it('defaults to true when is_public is null', () => {
    expect(isUserPublic({ ...baseUser, is_public: null as unknown as boolean })).toBe(true);
  });

  it('defaults to true when is_public is undefined', () => {
    expect(isUserPublic({ ...baseUser, is_public: undefined as unknown as boolean })).toBe(true);
  });
});
