import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side client bound to the request cookie jar. Use in route handlers /
// server components. Reads the signed-in user's session; respects RLS.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes the session
            // instead, so this can be safely ignored.
          }
        },
      },
    },
  );
}
