// Shim for legacy Next.js `createSupabaseClient()` import sites.
// Returns the shared TanStack browser singleton.
import { supabase } from '@/integrations/supabase/client';

export function createSupabaseClient() {
  return supabase;
}
