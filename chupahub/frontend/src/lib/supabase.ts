import { categories as fallbackCategories, products as fallbackProducts } from './data';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublicKey);

export type DbCategory = { id: string; name: string; slug: string; parent_id?: string; icon?: string; image_url?: string; description?: string; color?: string; sort_order?: number; is_active?: boolean };
export type DbVariant = { id: string; name: string; sku?: string; option_values?: Record<string, string>; price: number; old_price?: number; stock: number; image_url?: string; is_active?: boolean };
export type DbBanner = { id: string; title: string; subtitle?: string; image_url: string; mobile_image_url?: string; badge_text?: string; button_label?: string; button_url?: string; sort_order?: number };
export type DbPromotion = { id: string; title: string; code?: string; description?: string; image_url?: string; badge_text?: string; button_label?: string; button_url?: string; discount_type: string; discount_value: number; sort_order?: number };
export type DbDeliverySetting = { id: string; name: string; min_distance_km: number; max_distance_km?: number; fee: number; estimated_minutes_min: number; estimated_minutes_max: number };
export type DbProduct = {
  id: string; name: string; slug: string; description?: string; short_description?: string; seo_title?: string; seo_description?: string; sku?: string; abv?: number; country?: string; bottle_size?: string;
  price: number; old_price?: number; currency?: string; stock?: number; image_url?: string; gallery_urls?: string[];
  is_top_seller?: boolean; is_new_arrival?: boolean; is_featured?: boolean; is_active?: boolean;
  categories?: { name: string; slug: string } | null; brands?: { name: string; country?: string } | null;
  product_variants?: DbVariant[];
};

type SupabaseFetchOptions = { cache?: RequestCache; throwOnError?: boolean; resource?: string };

async function supabaseFetch<T>(path: string, options: SupabaseFetchOptions = {}): Promise<T[]> {
  if (!hasSupabaseConfig) {
    const error = new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the production Vercel environment.');
    if (options.throwOnError) throw error;
    return [];
  }
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: supabasePublicKey, Authorization: `Bearer ${supabasePublicKey}` },
      next: { revalidate: 5 },
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 1000);
      const error = new Error(`Supabase ${options.resource || 'request'} failed with HTTP ${response.status}: ${details}`);
      if (options.throwOnError) throw error;
      console.error('[ChupaHub Supabase]', error.message, { path, project: getSupabaseProjectRef() });
      return [];
    }
    return response.json();
  } catch (error) {
    console.error(`[ChupaHub Supabase] ${options.resource || 'request'} failed`, { path, project: getSupabaseProjectRef(), error });
    if (options.throwOnError) throw error;
    return [];
  }
}

export function getSupabaseProjectRef() {
  try { return new URL(supabaseUrl).hostname.split('.')[0] || 'unknown'; } catch { return 'invalid-url'; }
}

const fallbackDbCategories: DbCategory[] = fallbackCategories.map((category, index) => ({ id: String(index + 1), name: category.name, slug: category.slug, icon: category.icon, image_url: category.image, color: category.color, sort_order: index + 1 }));
const fallbackDbProducts: DbProduct[] = fallbackProducts.map((product) => ({
  id: String(product.id), name: product.name, slug: product.slug, description: product.description, abv: product.abv,
  country: product.country, bottle_size: product.bottleSize, price: product.price, old_price: product.oldPrice,
  stock: product.stock, image_url: product.images[0], gallery_urls: product.images, is_top_seller: true,
  is_new_arrival: true, is_featured: true, categories: { name: product.category, slug: product.category },
  brands: { name: product.brand, country: product.country },
}));

// The local data is only a deployment fallback when Supabase variables are absent.
// Once configured, an empty Supabase table remains empty and is never replaced by stale code data.
export async function getCategories(): Promise<DbCategory[]> {
  if (!hasSupabaseConfig) return fallbackDbCategories;
  return supabaseFetch<DbCategory>('categories?select=*&is_active=eq.true&order=sort_order.asc,name.asc');
}

export async function getCategory(slug: string): Promise<DbCategory | null> {
  if (!hasSupabaseConfig) return fallbackDbCategories.find((category) => category.slug === slug) || null;
  const rows = await supabaseFetch<DbCategory>(`categories?select=*&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] || null;
}

export async function getBanners(): Promise<DbBanner[]> {
  const rows = await supabaseFetch<DbBanner>('homepage_banners?select=*&is_active=eq.true&order=sort_order.asc,created_at.desc', {
    cache: 'no-store', throwOnError: true, resource: 'homepage_banners query',
  });
  const now = Date.now();
  const activeRows = rows.filter((row) => (!row.starts_at || Date.parse(row.starts_at) <= now) && (!row.ends_at || Date.parse(row.ends_at) >= now));
  console.info('[ChupaHub banners] Supabase synchronization complete', { project: getSupabaseProjectRef(), fetched: rows.length, visible: activeRows.length });
  return activeRows;
}

export async function getPromotions(): Promise<DbPromotion[]> {
  if (!hasSupabaseConfig) return [];
  const rows = await supabaseFetch<DbPromotion & { starts_at?: string; ends_at?: string }>('promotions?select=*&is_active=eq.true&order=sort_order.asc,created_at.desc');
  const now = Date.now();
  return rows.filter((row) => (!row.starts_at || Date.parse(row.starts_at) <= now) && (!row.ends_at || Date.parse(row.ends_at) >= now));
}

export async function getDeliverySettings(): Promise<DbDeliverySetting[]> {
  if (!hasSupabaseConfig) return [];
  return supabaseFetch<DbDeliverySetting>('delivery_settings?select=*&is_active=eq.true&order=sort_order.asc');
}

export async function getProducts(): Promise<DbProduct[]> {
  if (!hasSupabaseConfig) return fallbackDbProducts;
  return supabaseFetch<DbProduct>('products?select=*,categories(name,slug),brands(name,country),product_variants(*)&is_active=eq.true&order=sort_order.asc,created_at.desc');
}

export async function getProductsByCategory(slug: string): Promise<DbProduct[]> {
  if (!hasSupabaseConfig) return fallbackDbProducts.filter((product) => product.categories?.slug === slug);
  return supabaseFetch<DbProduct>(`products?select=*,categories!inner(name,slug),brands(name,country),product_variants(*)&is_active=eq.true&categories.slug=eq.${encodeURIComponent(slug)}&order=sort_order.asc,created_at.desc`);
}

export async function getProduct(slug: string): Promise<DbProduct | null> {
  if (!hasSupabaseConfig) return fallbackDbProducts.find((product) => product.slug === slug) || null;
  const rows = await supabaseFetch<DbProduct>(`products?select=*,categories(name,slug),brands(name,country),product_variants(*)&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`);
  return rows[0] || null;
}

export const money = (value: number) => `KES ${Number(value).toLocaleString('en-KE')}`;
export const imageFor = (product: DbProduct) => product.image_url || product.gallery_urls?.[0] || '/placeholder-product.png';
