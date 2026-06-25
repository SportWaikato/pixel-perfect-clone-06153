// Legacy Next.js server client shim — TanStack Start uses the same browser
// singleton; protected server-side reads should move to createServerFn +
// requireSupabaseAuth. This shim exists so old service files compile.
import { supabase } from '@/integrations/supabase/client';

export async function createSupabaseServer() {
  return supabase;
}
