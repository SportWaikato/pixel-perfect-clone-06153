import { toast } from 'sonner';

const CONSTRAINT_MESSAGES: Record<string, string> = {
  users_username_key: 'That username is already taken. Please choose a different one.',
  users_email_key: 'An account with that email already exists.',
};

function getFriendlyMessage(error: any): string {
  // Postgres unique constraint violation (code 23505)
  if (error?.code === '23505') {
    const constraint = error?.details?.match(/Key \(.*\)=.*\. .* "([^"]+)"/)?.[1]
      ?? error?.message?.match(/"([^"]+)"$/)?.[1];
    if (constraint && CONSTRAINT_MESSAGES[constraint]) {
      return CONSTRAINT_MESSAGES[constraint];
    }
    return 'A record with those details already exists.';
  }

  return error?.message || 'Something went wrong';
}

export function notifyAboutError(error: any): void {
  const message = getFriendlyMessage(error);
  toast.error(message);
  console.error('Error:', error);
}
