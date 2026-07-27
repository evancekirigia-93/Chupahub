'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DbBanner } from '@/lib/supabase';

export function HeroCarousel({ banners }: { banners: DbBanner[] }) {
  const slides = banners.slice(0, 3);
  const [current, setCurrent] = useState(0), [paused, setPaused] = useState(false);
  useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setCurrent(index => (index + 1) % slides.length), 3000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);
  useEffect(() => { if (current >= slides.length) setCurrent(0); }, [slides.length, current]);
  if (!slides.length) return <section className="mx-auto mt-4 rounded-3xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-card"><h1 className="text-2xl font-black text-brand-ink">No active homepage banner</h1><p className="mt-2 text-neutral-600">Upload and publish a banner in the admin to display it here.</p></section>;
  const move = (direction: number) => setCurrent(index => (index + direction + slides.length) % slides.length);
  return <section onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} aria-roledescription="carousel" aria-label="ChupaHub promotions" className="relative mx-auto max-w-none overflow-hidden bg-white shadow-card sm:mt-4 sm:rounded-3xl"><div className="relative h-56 sm:h-96">{slides.map((banner,index) => <article key={banner.id} aria-hidden={index !== current} className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}><picture><source media="(max-width: 640px)" srcSet={banner.mobile_image_url || banner.image_url}/><img src={banner.image_url} alt={banner.title} className="absolute inset-0 h-full w-full object-cover"/></picture><div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"/><div className="absolute bottom-5 left-5 max-w-md text-white">{banner.badge_text&&<p className="font-bold uppercase tracking-wide">{banner.badge_text}</p>}<h1 className="text-3xl font-black sm:text-5xl">{banner.title}</h1>{banner.subtitle&&<p className="mt-2 hidden text-white/90 sm:block">{banner.subtitle}</p>}{banner.button_url&&(banner.button_label||banner.button_text)&&<Link href={banner.button_url} className="orange-gradient mt-4 inline-block rounded-lg px-5 py-3 font-black uppercase text-white shadow-card">{banner.button_label||banner.button_text}</Link>}</div></article>)}</div>{slides.length>1&&<><button type="button" onClick={()=>move(-1)} aria-label="Previous hero image" className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-card"><ChevronLeft/></button><button type="button" onClick={()=>move(1)} aria-label="Next hero image" className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-ink shadow-card"><ChevronRight/></button><div className="absolute bottom-3 right-4 z-20 flex gap-2">{slides.map((banner,index)=><button key={banner.id} onClick={()=>setCurrent(index)} aria-label={`Show hero image ${index+1}`} className={`h-2.5 rounded-full transition-all ${index===current?'w-7 bg-white':'w-2.5 bg-white/55'}`}/>)}</div></>}</section>;
}
