import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. SERVER ONLY. Never import into a file
// that ships to the browser. Used to read stored GitHub tokens and to write
// streak updates atomically.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
