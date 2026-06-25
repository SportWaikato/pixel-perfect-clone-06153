import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { UserService } from '@/models/users/services/UserService';
import { InviteService } from '@/models/invites/services/InviteService';
import { SuperAdminInviteInterface } from '@/models/invites/interfaces/SuperAdminInviteInterface';

export async function createSuperAdminInvite(email: string): Promise<{ invite: SuperAdminInviteInterface; url: string }> {
  const supabase = await createSupabaseServer();
  const userService = new UserService(supabase);
  const currentUser = await userService.getCurrentUser();

  if (!currentUser || currentUser.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const inviteService = new InviteService(supabase);
  const invite = await inviteService.create(email, currentUser.id);

  const baseUrl = import.meta.env.VITE_APP_URL || '';
  const url = `${baseUrl}/invite/${invite.token}`;

  return { invite, url };
}

export async function revokeSuperAdminInvite(id: string): Promise<void> {
  const supabase = await createSupabaseServer();
  const userService = new UserService(supabase);
  const currentUser = await userService.getCurrentUser();

  if (!currentUser || currentUser.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const inviteService = new InviteService(supabase);
  await inviteService.revoke(id);
}
