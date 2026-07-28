import type { MetadataRoute } from 'next';
import { getCategories, getHomepageSections, getProducts } from '@/lib/supabase';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;
const publicPages = ['/', '/shop', '/beer', '/wine', '/whisky', '/gin', '/vodka', '/champagne', '/spirits', '/mixers', '/offers', '/collections/top-sellers', '/collections/new-arrivals', '/collections/featured', '/about', '/contact', '/faq', '/track-order', '/privacy', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, sections] = await Promise.all([getCategories(), getProducts(), getHomepageSections()]);
  const now = new Date();
  return [
    ...publicPages.map((path, index) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency: (index === 0 ? 'daily' : 'weekly') as 'daily' | 'weekly', priority: index === 0 ? 1 : 0.8 })),
    ...categories.map(category => ({ url: absoluteUrl(`/category/${category.slug}`), lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...sections.map(section => ({ url: absoluteUrl(`/collections/${section.id}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map(product => ({ url: absoluteUrl(`/product/${product.slug}`), lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
  ];
}
