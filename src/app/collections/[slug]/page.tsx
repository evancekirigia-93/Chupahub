import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard, ProductVariantCard } from '@/components/Site';
import { absoluteUrl, breadcrumbSchema, JsonLd } from '@/lib/seo';
import { effectivePrice, getHomepageSection, getProducts } from '@/lib/supabase';

const collections = {
  'top-sellers': { title: 'Top Sellers', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_top_seller) },
  'new-arrivals': { title: 'New Arrivals', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_new_arrival) },
  featured: { title: 'Featured Offers', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => Boolean(product.is_featured) },
  offers: { title: 'Discounted Offers', matches: (product: Awaited<ReturnType<typeof getProducts>>[number]) => effectivePrice(product).active || (product.product_variants || []).some(variant => effectivePrice(variant).active) },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, builtIn = collections[slug as keyof typeof collections], section = builtIn ? null : await getHomepageSection(slug);
  const title = builtIn?.title || section?.heading || 'Collection';
  const description = `Shop ${title.toLowerCase()} from ChupaHub with convenient drinks delivery across Nairobi.`;
  return { title, description, alternates: { canonical: `/collections/${slug}` }, openGraph: { title: `${title} | ChupaHub`, description, url: `/collections/${slug}`, type: 'website' }, twitter: { card: 'summary', title: `${title} | ChupaHub`, description }, robots: section || builtIn ? { index: true, follow: true } : { index: false, follow: false } };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, collection = collections[slug as keyof typeof collections];
  const allProducts = await getProducts();
  let title: string, products;
  if (collection) { title = collection.title; products = allProducts.filter(collection.matches); }
  else {
    const section = await getHomepageSection(slug);
    if (!section) notFound();
    title = section.heading;
    products = section.product_ids?.length ? section.product_ids.map(id => allProducts.find(product => product.id === id)).filter((product): product is typeof allProducts[number] => Boolean(product)) : section.use_best_sellers ? allProducts.filter(product => product.is_top_seller) : section.categories?.slug ? allProducts.filter(product => product.categories?.slug === section.categories?.slug) : allProducts;
  }
  const url = `/collections/${slug}`;
  return <main className="mx-auto max-w-7xl px-4 py-8"><JsonLd data={[{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: absoluteUrl(url), numberOfItems: products.length }, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: title, url }])]}/><nav aria-label="Breadcrumb" className="mb-4 text-sm text-neutral-600"><a href="/">Home</a> / {title}</nav><div className="rounded-3xl bg-white p-6 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Shop ChupaHub</p><h1 className="text-4xl font-black text-brand-ink">{title}</h1><p className="mt-2 text-neutral-600">Browse every available product in this collection.</p></div>{products.length ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6">{products.flatMap(product => { const variants = (product.product_variants || []).filter(variant => variant.is_active !== false); return [<ProductCard key={product.id} p={product}/>, ...variants.slice(1).map(variant => <ProductVariantCard key={variant.id} product={product} variant={variant}/>)]; })}</div> : <p className="mt-6 rounded-2xl bg-white p-6">No active products are currently available in this collection.</p>}</main>;
}
