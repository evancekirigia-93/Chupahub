'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';

const identityKey = 'chupahub-visitor-id';
const adminKey = 'chupahub-admin-browser';

/** Browser uniques, not page views. No IP addresses or personal details are stored. */
export function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const db = createBrowserSupabase();
    if (!db) return;
    let stopped = false;
    let pending = false;
    const adminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    if (adminRoute) {
      try { localStorage.setItem(adminKey, '1'); } catch { /* Storage may be blocked. */ }
    }
    async function heartbeat() {
      if (pending || stopped || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        // Fail closed if auth cannot be checked: never count an unknown admin session.
        const { data: { session }, error } = await db!.auth.getSession();
        if (error || stopped) return;
        if (session) {
          const { data: admin, error: adminError } = await db!.rpc('current_admin');
          if (adminError || stopped) return;
          if (Array.isArray(admin) && admin.length) {
            localStorage.setItem(adminKey, '1');
            const existing = localStorage.getItem(identityKey);
            if (existing) await db!.rpc('record_website_visit', { p_visitor_id: existing });
            return;
          }
        }
        if (adminRoute || localStorage.getItem(adminKey)) return;
        let id = localStorage.getItem(identityKey);
        if (!id) {
          // A shared cookie resolves simultaneous first loads in multiple tabs.
          id = document.cookie.split('; ').find(item => item.startsWith('chupahub_visitor='))?.split('=')[1] || crypto.randomUUID();
          document.cookie = `chupahub_visitor=${id}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
          localStorage.setItem(identityKey, id);
        }
        if (!stopped) await db!.rpc('record_website_visit', { p_visitor_id: id });
      } catch { /* No unstable fallback identity: blocked storage must not inflate uniques. */ }
      finally { pending = false; }
    }
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 30_000);
    const visible = () => void heartbeat();
    document.addEventListener('visibilitychange', visible);
    const { data: { subscription } } = db.auth.onAuthStateChange(() => { window.setTimeout(visible, 0); });
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', visible); subscription.unsubscribe(); };
  }, [pathname]);
  return null;
}
