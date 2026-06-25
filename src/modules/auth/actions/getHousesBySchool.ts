'use server';

import { createSupabaseServer } from '@/models/supabase/services/SupabaseServer';
import { HouseService } from '@/models/houses/services/HouseService';
import { HouseInterface } from '@/models/houses/interfaces/HouseInterface';

export async function getHousesBySchool(schoolId: string): Promise<HouseInterface[]> {
  if (!schoolId) return [];
  const supabase = await createSupabaseServer();
  const houseService = new HouseService(supabase);
  return houseService.getBySchoolId(schoolId);
}
