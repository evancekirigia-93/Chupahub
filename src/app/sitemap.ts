import type { MetadataRoute } from 'next';
import { getCategories, getProducts } from '@/lib/supabase';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const now = new Date();
  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    ...categories.map((category) => ({ url: absoluteUrl(`/category/${category.slug}`), lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...products.map((product) => ({ url: absoluteUrl(`/product/${product.slug}`), lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
  ];
}
