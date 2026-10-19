'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const measurementId = 'G-831BEQ3XMB';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    'ga-disable-G-831BEQ3XMB'?: boolean;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [enabledPath, setEnabledPath] = useState<string | null>(null);
  useEffect(() => {
    let stopped = false;
    window['ga-disable-G-831BEQ3XMB'] = true;
    async function enable() {
      try {
        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
          localStorage.setItem('chupahub-admin-browser', '1');
          return;
        }
        if (localStorage.getItem('chupahub-admin-browser')) return;
        const db = createBrowserSupabase();
        if (db) {
          const { data: { session }, error } = await db.auth.getSession();
          if (error) return;
          if (session) {
            const { data, error: failure } = await db.rpc('current_admin');
            if (failure) return;
            if (Array.isArray(data) && data.length) {
              localStorage.setItem('chupahub-admin-browser', '1');
              return;
            }
          }
        }
        if (!stopped) {
          window['ga-disable-G-831BEQ3XMB'] = false;
          setEnabledPath(pathname);
        }
      } catch { /* Keep analytics disabled when browser storage/auth is unavailable. */ }
    }
    void enable();
    return () => { stopped = true; window['ga-disable-G-831BEQ3XMB'] = true; };
  }, [pathname]);

  if (enabledPath !== pathname) return null;
  return <>
    <Script id="google-analytics-config" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){dataLayer.push(arguments);};
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `}</Script>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
  </>;
}
