import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabasePublicKey, supabaseUrl } from './supabase';

// Database types can be generated and substituted here after linking the production project.
// Until then, authorization is enforced by Supabase RLS rather than client-side table typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: SupabaseClient<any> | null | undefined;

export function createBrowserSupabase() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  if (browserClient !== undefined) return browserClient;
  browserClient = createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}
