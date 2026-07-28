import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { authCookieOptions, decodeAuthCookie, encodeAuthCookie } from '@/lib/supabase-auth-storage';
import { supabasePublicKey, supabaseUrl } from '@/lib/supabase';

export async function createServerSupabase() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  const cookieStore = await cookies();
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key) => decodeAuthCookie(cookieStore.get(key)?.value),
        setItem: (key, value) => { cookieStore.set(key, encodeAuthCookie(value), authCookieOptions); },
        removeItem: (key) => { cookieStore.set(key, '', { ...authCookieOptions, maxAge: 0 }); },
      },
    },
  });
}
