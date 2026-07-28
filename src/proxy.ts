import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { authCookieOptions, decodeAuthCookie, encodeAuthCookie } from '@/lib/supabase-auth-storage';
import { supabasePublicKey, supabaseUrl } from '@/lib/supabase';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseUrl || !supabasePublicKey) return response;
  const supabase = createClient(supabaseUrl, supabasePublicKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key) => decodeAuthCookie(request.cookies.get(key)?.value),
        setItem: (key, value) => {
          const encoded = encodeAuthCookie(value);
          request.cookies.set(key, encoded);
          response = NextResponse.next({ request });
          response.cookies.set(key, encoded, authCookieOptions);
        },
        removeItem: (key) => {
          request.cookies.delete(key);
          response = NextResponse.next({ request });
          response.cookies.set(key, '', { ...authCookieOptions, maxAge: 0 });
        },
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
