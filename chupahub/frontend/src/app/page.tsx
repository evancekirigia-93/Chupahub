import Link from 'next/link';
import { CategoryGrid, ProductRail } from '@/components/Site';
import { getBanners, getCategories, getProducts, getPromotions, money } from '@/lib/supabase';

export default async function Home() {
  const [categories, banners, products, promotions] = await Promise.all([
    getCategories(), getBanners(), getProducts(), getPromotions(),
  ]);
  const hero = banners[0];
  const topSellers = products.filter((product) => product.is_top_seller).slice(0, 8);
  const arrivals = products.filter((product) => product.is_new_arrival).slice(0, 8);
  const featured = products.filter((product) => product.is_featured).slice(0, 8);

  return <main>
    <section className="mx-auto max-w-none overflow-hidden bg-white shadow-card sm:mt-4 sm:rounded-3xl">
      <div className="relative h-48 sm:h-80">
        <img src={hero?.image_url || 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1600&q=80'} alt={hero?.title || 'ChupaHub promotion'} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
        <div className="absolute bottom-5 left-5 max-w-md text-white">
          <p className="font-bold uppercase tracking-wide">{hero?.badge_text || 'Orange deals every day'}</p>
          <h1 className="text-3xl font-black sm:text-5xl">{hero?.title || 'Premium drinks delivered fast'}</h1>
          <p className="mt-2 hidden text-white/90 sm:block">{hero?.subtitle || 'Browse ChupaHub and get premium drinks delivered fast.'}</p>
          <Link href={hero?.button_url || '/category/beer'} className="mt-4 inline-block rounded-lg bg-brand-deep px-5 py-3 font-black uppercase text-white shadow-card">{hero?.button_label || 'Buy now'}</Link>
        </div>
      </div>
    </section>
    {promotions.length > 0 && <section className="mx-auto grid max-w-none gap-3 px-4 pt-5 md:grid-cols-2">
      {promotions.map((promotion) => <Link key={promotion.id} href={promotion.button_url || '/'} className="orange-gradient flex items-center justify-between rounded-2xl p-5 text-white shadow-orange">
        <div><p className="text-xs font-black uppercase tracking-widest">{promotion.badge_text || promotion.code || 'Promotion'}</p><h2 className="text-2xl font-black">{promotion.title}</h2><p className="mt-1 text-sm text-white/85">{promotion.description}</p></div>
        <div className="ml-4 shrink-0 rounded-full bg-white px-4 py-3 text-center font-black text-brand-deep">{promotion.discount_type === 'percent' ? `${promotion.discount_value}%` : money(promotion.discount_value)}</div>
      </Link>)}
    </section>}
    <CategoryGrid categories={categories} />
    <ProductRail title="Top Sellers" products={topSellers} />
    <ProductRail title="New Arrivals" products={arrivals} />
    <ProductRail title="Featured Offers" products={featured} />
  </main>;
}
