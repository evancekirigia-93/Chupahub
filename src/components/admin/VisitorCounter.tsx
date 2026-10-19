'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Statistics = { online: number; today: number; week: number; month: number; total: number; started_at: string };

export function VisitorCounter() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const db = createBrowserSupabase();
    let stopped = false;
    async function refresh() {
      if (!db) { setError('Visitor analytics is not configured.'); return; }
      const { data, error: failure } = await db.rpc('website_visitor_statistics');
      if (stopped) return;
      if (failure || !data) { setError('Visitor statistics unavailable. Check analytics migration and access.'); setStats(null); }
      else { setStats(data as Statistics); setError(''); }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => { stopped = true; clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); container.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div ref={container} className="relative ml-auto">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="visitor-statistics" aria-label={`Visitor statistics, ${stats ? stats.today.toLocaleString() : 'unavailable'} visitors today`} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-bold hover:bg-white/20">
      <Eye size={19} aria-hidden="true"/><span>{stats ? stats.today.toLocaleString() : '—'}</span><span className="hidden sm:inline">today</span>
    </button>
    {open && <section id="visitor-statistics" aria-label="Visitor statistics" className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[85vw] rounded-2xl border border-orange-100 bg-white p-4 text-brand-ink shadow-xl">
      <h2 className="font-black">Website visitors</h2>
      {error ? <p role="status" className="mt-3 text-sm text-red-700">{error}</p> : !stats ? <p role="status">Loading…</p> : <>
        <dl className="mt-3 space-y-2">{([['Visitors online now', stats.online], ['Visitors today', stats.today], ['Visitors this week', stats.week], ['Visitors this month', stats.month], ['Total unique visitors', stats.total]] as const).map(([label, count]) => <div key={label} className="flex justify-between gap-3 text-sm"><dt>{label}</dt><dd className="font-black">{count.toLocaleString()}</dd></div>)}</dl>
        <p className="mt-3 text-xs text-neutral-500">Tracking since {new Date(stats.started_at).toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'long', year: 'numeric' })}. Nairobi time; week starts Monday. Online means active within 2 minutes.</p>
        <p className="mt-2 text-xs text-neutral-500">Unique browsers; clearing browser storage or using another device counts separately. Admin browsers excluded.</p>
      </>}
    </section>}
  </div>;
}
