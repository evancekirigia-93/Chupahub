import type { Metadata } from 'next';
import { ProductCard, ProductVariantCard } from '@/components/Site';
import { getCategories, getCategory, getProductsByCategory } from '@/lib/supabase';
import { breadcrumbSchema, JsonLd, plainText, truncate } from '@/lib/seo';

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  const name = category?.name || slug.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const title = category?.seo_title || `${name} Delivery Nairobi – Order Online`;
  const description = truncate(category?.seo_description || plainText(category?.description) || `Order ${name.toLowerCase()} online from ChupaHub with fast, reliable ${name.toLowerCase()} delivery across Nairobi.`);
  const url = `/category/${slug}`;
  return {
    title, description, alternates: { canonical: url },
    keywords: [`${name} Delivery Nairobi`, `${name} online Nairobi`, 'Alcohol Delivery Nairobi', 'Liquor Delivery Nairobi'],
    openGraph: { title: `${title} | ChupaHub`, description, url, type: 'website', images: category?.image_url ? [{ url: category.image_url, alt: `${name} delivery Nairobi` }] : undefined },
    twitter: { card: category?.image_url ? 'summary_large_image' : 'summary', title: `${title} | ChupaHub`, description, images: category?.image_url ? [category.image_url] : undefined },
  };
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, list] = await Promise.all([getCategory(slug), getProductsByCategory(slug)]);
  const title = category?.name || slug.replaceAll('-', ' ');
  return <main className="mx-auto max-w-none px-4 py-8">
    <JsonLd data={breadcrumbSchema([{ name: 'Home', url: '/' }, { name: title, url: `/category/${slug}` }])} />
    <div className="rounded-3xl bg-white p-6 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Alcohol delivery Nairobi</p><h1 className="text-4xl font-black capitalize text-brand-ink sm:text-6xl">{title} Delivery Nairobi</h1><p className="mt-3 max-w-3xl text-neutral-600">{plainText(category?.description) || `Shop ${title.toLowerCase()} online for fast delivery across Nairobi.`}</p><div className="mt-6 grid gap-3 md:grid-cols-5"><input className="rounded-xl border border-orange-100 bg-brand-soft p-3 outline-brand-orange" placeholder={`Filter ${title.toLowerCase()}`} /><select className="rounded-xl border border-orange-100 bg-white p-3"><option>Sort by relevance</option><option>Price low to high</option><option>Price high to low</option></select></div></div>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-8">{list.flatMap((product) => { const variants = (product.product_variants || []).filter((variant) => variant.is_active !== false); return [<ProductCard key={product.id} p={product} />, ...variants.slice(1).map((variant) => <ProductVariantCard key={variant.id} product={product} variant={variant} />)]; })}</div>
  </main>;
}
