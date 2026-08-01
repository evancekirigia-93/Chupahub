import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryCatalog } from '@/components/CategoryCatalog';
import { getCategories, getCategory, getProducts, getProductsByCategory } from '@/lib/supabase';
import { absoluteUrl, breadcrumbSchema, JsonLd, plainText, truncate } from '@/lib/seo';
import { categoryCanonicalPath } from '@/lib/public-urls';

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
  const url = categoryCanonicalPath(slug);
  return {
    title, description, alternates: { canonical: url },
    keywords: [`${name} Delivery Nairobi`, `${name} online Nairobi`, 'Alcohol Delivery Nairobi', 'Liquor Delivery Nairobi'],
    openGraph: { title: `${title} | ChupaHub`, description, url, type: 'website', images: category?.image_url ? [{ url: category.image_url, alt: `${name} delivery Nairobi` }] : undefined },
    twitter: { card: category?.image_url ? 'summary_large_image' : 'summary', title: `${title} | ChupaHub`, description, images: category?.image_url ? [category.image_url] : undefined },
  };
}

export default async function Category({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, list] = await Promise.all([slug === 'all' ? null : getCategory(slug), slug === 'all' ? getProducts() : getProductsByCategory(slug)]);
  if (slug !== 'all' && !category) notFound();
  const title = slug === 'all' ? 'All Products' : category?.name || slug.replaceAll('-', ' ');
  return <>
    <JsonLd data={[{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: absoluteUrl(categoryCanonicalPath(slug)), numberOfItems: list.length }, breadcrumbSchema([{ name: 'Home', url: '/' }, { name: title, url: categoryCanonicalPath(slug) }])]} />
    <CategoryCatalog title={title} slug={slug} products={list}/>
  </>;
}
