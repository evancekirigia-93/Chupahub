import Link from 'next/link';
import { CategoryGrid, ProductRail } from '@/components/Site';
import { getBanners, getCategories, getProducts, getPromotions, money } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [categories, banners, products, promotions] = await Promise.all([
    getCategories(), getBanners(), getProducts(), getPromotions(),
  ]);
  const hero = banners[0];
  const topSellers = products.filter((product) => product.is_top_seller).slice(0, 8);
  const arrivals = products.filter((product) => product.is_new_arrival).slice(0, 8);
  const featured = products.filter((product) => product.is_featured).slice(0, 8);

  return <main>
    {hero ? <section className="mx-auto max-w-none overflow-hidden bg-white shadow-card sm:mt-4 sm:rounded-3xl">
      <div className="relative h-48 sm:h-80">
        <picture><source media="(max-width: 640px)" srcSet={hero.mobile_image_url || hero.image_url} /><img src={hero.image_url} alt={hero.title} className="absolute inset-0 h-full w-full object-cover" /></picture>
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
        <div className="absolute bottom-5 left-5 max-w-md text-white">
          {hero.badge_text && <p className="font-bold uppercase tracking-wide">{hero.badge_text}</p>}
          <h1 className="text-3xl font-black sm:text-5xl">{hero.title}</h1>
          {hero.subtitle && <p className="mt-2 hidden text-white/90 sm:block">{hero.subtitle}</p>}
          {hero.button_url && (hero.button_label || hero.button_text) && <Link href={hero.button_url} className="mt-4 inline-block rounded-lg bg-brand-deep px-5 py-3 font-black uppercase text-white shadow-card">{hero.button_label || hero.button_text}</Link>}
        </div>
      </div>
    </section> : <section className="mx-auto mt-4 rounded-3xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-card"><h1 className="text-2xl font-black text-brand-ink">No active homepage banner</h1><p className="mt-2 text-neutral-600">Publish a banner in Supabase to display it here.</p></section>}
    {promotions.length > 0 && <section className="mx-auto grid max-w-none gap-3 px-4 pt-5 md:grid-cols-2">
      {promotions.map((promotion) => <Link key={promotion.id} href={promotion.button_url || '/'} className="orange-gradient flex items-center justify-between rounded-2xl p-5 text-white shadow-orange">
        <div><p className="text-xs font-black uppercase tracking-widest">{promotion.badge_text || promotion.code || 'Promotion'}</p><h2 className="text-2xl font-black">{promotion.title}</h2><p className="mt-1 text-sm text-white/85">{promotion.description}</p></div>
        <div className="ml-4 shrink-0 rounded-full bg-white px-4 py-3 text-center font-black text-brand-deep">{promotion.discount_type === 'percent' ? `${promotion.discount_value}%` : money(promotion.discount_value)}</div>
      </Link>)}
    </section>}
    <CategoryGrid categories={categories.filter((category) => !category.parent_id)} />
    <ProductRail title="Top Sellers" products={topSellers} />
    <ProductRail title="New Arrivals" products={arrivals} />
    <ProductRail title="Featured Offers" products={featured} />
  </main>;
}
