import { createClient } from '@supabase/supabase-js';

export async function fetchUserEmails(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};

  const adminClient = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await adminClient.rpc('get_user_emails_by_ids', { user_ids: userIds });
  if (error) throw new Error(error.message);

  return Object.fromEntries(
    (data as { id: string; email: string }[]).map(row => [row.id, row.email])
  );
}
