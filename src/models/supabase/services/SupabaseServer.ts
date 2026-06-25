import { createClient } from '@supabase/supabase-js';
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // No-op for Server Components to prevent cookie modification errors
          // Cookies will be managed by client-side components when needed
        },
      },
    }
  );
} 