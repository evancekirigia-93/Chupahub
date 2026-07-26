import { notFound } from 'next/navigation';
import { ProductCard, ProductVariantCard } from '@/components/Site';
import { getProducts } from '@/lib/supabase';

const collections = {
  'top-sellers': { title: 'Top Sellers', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_top_seller) },
  'new-arrivals': { title: 'New Arrivals', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_new_arrival) },
  featured: { title: 'Featured Offers', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_featured) },
};

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, collection = collections[slug as keyof typeof collections];
  if (!collection) notFound();
  const products = (await getProducts()).filter(collection.matches);
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="rounded-3xl bg-white p-6 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Shop ChupaHub</p><h1 className="text-4xl font-black text-brand-ink">{collection.title}</h1><p className="mt-2 text-neutral-600">Browse every available product in this collection.</p></div>{products.length ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6">{products.flatMap(product => { const variants = (product.product_variants || []).filter(variant => variant.is_active !== false); return [<ProductCard key={product.id} p={product}/>, ...variants.slice(1).map(variant => <ProductVariantCard key={variant.id} product={product} variant={variant}/>)]; })}</div> : <p className="mt-6 rounded-2xl bg-white p-6">No active products are currently available in this collection.</p>}</main>;
}
