import { categories as fallbackCategories, products as fallbackProducts, slides as fallbackSlides } from './data';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoiafygddwqwjqvaahtb.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type DbCategory = { id: string; name: string; slug: string; icon?: string; image_url?: string; sort_order?: number };
export type DbBanner = { id: string; title: string; subtitle?: string; image_url: string; button_label?: string; button_url?: string; sort_order?: number };
export type DbProduct = {
  id: string; name: string; slug: string; description?: string; abv?: number; country?: string; bottle_size?: string;
  price: number; old_price?: number; stock?: number; image_url?: string; gallery_urls?: string[];
  is_top_seller?: boolean; is_new_arrival?: boolean; is_featured?: boolean;
  categories?: { name: string; slug: string } | null; brands?: { name: string; country?: string } | null;
};

async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T[]> {
  if (!supabaseAnonKey) return [];
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, ...(init?.headers || {}) },
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getCategories() {
  const rows = await supabaseFetch<DbCategory>('categories?select=*&is_active=eq.true&order=sort_order.asc,name.asc');
  return rows.length ? rows : fallbackCategories.map((category, index) => ({ id: String(index + 1), name: category.name, slug: category.slug, icon: category.icon, image_url: category.image, sort_order: index + 1 }));
}

export async function getBanners() {
  const rows = await supabaseFetch<DbBanner>('homepage_banners?select=*&is_active=eq.true&order=sort_order.asc,created_at.desc');
  return rows.length ? rows : fallbackSlides.map((slide, index) => ({ id: String(index + 1), title: slide.title, subtitle: slide.description, image_url: slide.image, button_label: slide.cta, button_url: slide.href, sort_order: index + 1 }));
}

const fallbackDbProducts = fallbackProducts.map((product) => ({
  id: String(product.id),
  name: product.name,
  slug: product.slug,
  description: product.description,
  abv: product.abv,
  country: product.country,
  bottle_size: product.bottleSize,
  price: product.price,
  old_price: product.oldPrice,
  stock: product.stock,
  image_url: product.images[0],
  gallery_urls: product.images,
  is_top_seller: true,
  is_new_arrival: true,
  is_featured: true,
  categories: { name: product.category, slug: product.category },
  brands: { name: product.brand, country: product.country },
}));

export async function getProducts(filter = '') {
  const base = 'products?select=*,categories(name,slug),brands(name,country)&is_active=eq.true&order=created_at.desc';
  const rows = await supabaseFetch<DbProduct>(`${base}${filter}`);
  return rows.length ? rows : fallbackDbProducts;
}

export async function getProductsByCategory(slug: string) {
  const rows = await supabaseFetch<DbProduct>(`products?select=*,categories!inner(name,slug),brands(name,country)&is_active=eq.true&categories.slug=eq.${encodeURIComponent(slug)}&order=created_at.desc`);
  return rows.length ? rows : fallbackDbProducts.filter((product) => product.categories?.slug === slug);
}

export async function getProduct(slug: string) {
  const rows = await supabaseFetch<DbProduct>(`products?select=*,categories(name,slug),brands(name,country)&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] || fallbackDbProducts.find((product) => product.slug === slug) || null;
}

export const money = (n: number) => `KES ${Number(n).toLocaleString('en-KE')}`;
export const imageFor = (p: DbProduct) => p.image_url || p.gallery_urls?.[0] || '/placeholder-product.png';
