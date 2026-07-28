export function decodeAuthCookie(value?: string) {
  if (!value) return null;
  try { return decodeURIComponent(value); } catch { return value; }
}

export function encodeAuthCookie(value: string) {
  return encodeURIComponent(value);
}

export const authCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365,
};
