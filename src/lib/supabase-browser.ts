import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authCookieOptions, decodeAuthCookie, encodeAuthCookie } from './supabase-auth-storage';
import { supabasePublicKey, supabaseUrl } from './supabase';

// Database types can be generated and substituted here after linking the production project.
// Until then, authorization is enforced by Supabase RLS rather than client-side table typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: SupabaseClient<any> | null | undefined;

function readCookie(key: string) {
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${key}=`));
  return decodeAuthCookie(match?.slice(key.length + 1));
}

export function createBrowserSupabase() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  if (browserClient !== undefined) return browserClient;
  try {
    browserClient = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: {
          getItem: readCookie,
          setItem: (key, value) => { document.cookie = `${key}=${encodeAuthCookie(value)}; Path=${authCookieOptions.path}; Max-Age=${authCookieOptions.maxAge}; SameSite=Lax${authCookieOptions.secure ? '; Secure' : ''}`; },
          removeItem: (key) => { document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Lax${authCookieOptions.secure ? '; Secure' : ''}`; },
        },
      },
    });
  } catch (error) {
    console.error('[ChupaHub Supabase] Browser client configuration is invalid.', error);
    browserClient = null;
  }
  return browserClient;
}
