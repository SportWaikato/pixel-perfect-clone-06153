import { UserInterface } from '@/models/users/interfaces/UserInterface';

/**
 * Returns a display name for a user, respecting their privacy settings
 */
export const getUserDisplayName = (user: UserInterface): string => {
  if (!user.is_public) {
    return 'Anonymous User';
  }
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return 'Unknown User';
};

/**
 * Returns an anonymized version of a user if they are private
 */
export const getDisplayUser = (user: UserInterface): UserInterface => {
  if (user.is_public) {
    return user;
  }

  return {
    ...user,
    username: 'Anonymous',
    first_name: 'Anonymous',
    last_name: 'User',
    social_handle: undefined,
    profile_icon_url: undefined,
  };
};

/**
 * Checks if a user's profile should be shown publicly
 */
export const isUserPublic = (user: UserInterface): boolean => {
  return user.is_public ?? true; // Default to public if not set
};