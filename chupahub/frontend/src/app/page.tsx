import Link from 'next/link';
import { CategoryGrid, ProductRail } from '@/components/Site';
import { getBanners, getCategories, getProducts } from '@/lib/supabase';

export default async function Home() {
  const [categories, banners, products] = await Promise.all([getCategories(), getBanners(), getProducts()]);
  const hero = banners[0];
  const topSellers = products.filter((p) => p.is_top_seller).slice(0, 8);
  const arrivals = products.filter((p) => p.is_new_arrival).slice(0, 8);
  return <main><section className="mx-auto max-w-none overflow-hidden bg-white shadow-card sm:mt-4 sm:rounded-3xl"><div className="relative h-48 sm:h-80"><img src={hero?.image_url || 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1600&q=80'} alt="ChupaHub promotion" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" /><div className="absolute bottom-5 left-5 max-w-md text-white"><p className="font-bold uppercase tracking-wide">Orange deals every day</p><h1 className="text-3xl font-black sm:text-5xl">{hero?.title || 'Premium drinks delivered fast'}</h1><p className="mt-2 hidden text-white/90 sm:block">{hero?.subtitle || 'Live inventory from Supabase. Update admin content once and Vercel shows it automatically.'}</p><Link href={hero?.button_url || '/category/beer'} className="mt-4 inline-block rounded-lg bg-brand-deep px-5 py-3 font-black uppercase text-white shadow-card">{hero?.button_label || 'Buy now'}</Link></div></div></section><CategoryGrid categories={categories} /><ProductRail title="Top Sellers" products={topSellers.length ? topSellers : products.slice(0, 8)} /><ProductRail title="New Arrivals" products={arrivals.length ? arrivals : products.slice(0, 8)} /><ProductRail title="Party Offers" products={products.slice(0, 8)} /></main>;
}
