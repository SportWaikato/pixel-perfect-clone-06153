'use server';

import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { UserService } from '@/models/users/services/UserService';
import { ActivityService } from '@/models/activities/services/ActivityService';

async function getAdminUser() {
  const supabase = await createSupabaseServer();
  const userService = new UserService(supabase);
  const currentUser = await userService.getCurrentUser();

  if (!currentUser || (currentUser.role !== 'school_admin' && currentUser.role !== 'super_admin')) {
    throw new Error('Unauthorized');
  }

  return { supabase, currentUser };
}

async function verifyActivityOwnership(supabase: SupabaseClient, activityId: string, schoolId: string): Promise<void> {
  const activityResult = await supabase
    .from('activities')
    .select('user_id')
    .eq('id', activityId)
    .single();

  const userId = activityResult.data?.user_id ?? '';

  const { data: activityUser } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', userId)
    .single();

  if (!activityUser || activityUser.school_id !== schoolId) {
    throw new Error('Unauthorized: Activity does not belong to your school');
  }
}

export async function rejectActivity(activityId: string): Promise<void> {
  const { supabase, currentUser } = await getAdminUser();

  if (currentUser.role === 'school_admin') {
    await verifyActivityOwnership(supabase, activityId, currentUser.school_id!);
  }

  const activityService = new ActivityService(supabase);
  await activityService.rejectActivity(activityId);
}

export async function undoRejectActivity(activityId: string): Promise<void> {
  const { supabase, currentUser } = await getAdminUser();

  if (currentUser.role === 'school_admin') {
    await verifyActivityOwnership(supabase, activityId, currentUser.school_id!);
  }

  const activityService = new ActivityService(supabase);
  await activityService.restoreActivity(activityId);
}

export async function rejectActivitiesBulk(activityIds: string[]): Promise<void> {
  if (activityIds.length === 0) return;

  const { supabase, currentUser } = await getAdminUser();

  if (currentUser.role === 'school_admin') {
    // Verify all activities belong to this admin's school
    await Promise.all(
      activityIds.map(id => verifyActivityOwnership(supabase, id, currentUser.school_id!))
    );
  }

  const activityService = new ActivityService(supabase);
  await activityService.rejectActivities(activityIds);
}
