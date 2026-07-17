import { createClient } from '@supabase/supabase-js';
import { supabasePublicKey, supabaseUrl } from './supabase';

export function createBrowserSupabase() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}
