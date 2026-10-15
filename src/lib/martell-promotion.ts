import type { SupabaseClient } from '@supabase/supabase-js';

export const MARTELL_BANNER_ID = 'd1ae5c3e-15a4-4ef3-b966-5c054a49a999';
export const MARTELL_REGISTRATION_KEY = 'martell_vsop_1l_banner_registered';
type PromotionProduct = {
  id: string; name: string; slug: string; bottle_size?: string; is_active?: boolean;
  product_variants?: { id: string; name: string; is_active?: boolean }[];
};
const oneLitre = (value = '') => /^(?:1l|1lt|1ltr|1ltrs|1litre|1litres|1liter|1liters|1000ml)$/.test(value.toLowerCase().replace(/[^a-z0-9]/g, ''));

export function martellProductLink(products: PromotionProduct[]): string | null {
  for (const product of products) {
    const name = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (product.is_active === false || !name.includes('martell') || !name.includes('vsop')) continue;
    const variants = (product.product_variants || []).filter(variant => variant.is_active !== false);
    const litreVariant = variants.find(variant => oneLitre(variant.name));
    if (litreVariant) return `/product/${product.slug}?variant=${encodeURIComponent(litreVariant.id)}`;
    if (!variants.length && (oneLitre(product.bottle_size) || /\b(?:1\s*(?:litres?|liters?|ltrs?|lt|l)|1000\s*ml)\b/i.test(product.name))) {
      return `/product/${product.slug}`;
    }
  }
  return null;
}

export function martellBanner(products: PromotionProduct[]) {
  return {
    id: MARTELL_BANNER_ID,
    title: 'Martell VSOP 1 Litre — KSh 8,999 · 30% off',
    subtitle: 'Martell VSOP 1 Litre at KSh 8,999',
    image_url: '/banners/martell-vsop-8999.webp',
    mobile_image_url: '/banners/martell-vsop-8999-mobile.webp',
    button_label: 'Shop Martell VSOP 1 Litre',
    button_url: martellProductLink(products),
    is_active: true,
    sort_order: -1000,
  };
}

/** Register once through the signed-in admin's existing RLS permissions. */
export async function registerMartellBanner(db: SupabaseClient, products: PromotionProduct[]) {
  const { data, error } = await db.from('store_settings').select('value').eq('key', MARTELL_REGISTRATION_KEY).maybeSingle();
  if (error) throw new Error(`Could not check the Martell banner registration: ${error.message}`);
  if (data?.value?.registered) return;
  const banner = martellBanner(products);
  if (!banner.button_url) throw new Error('The Martell banner needs an active Martell VSOP 1 Litre product or 1 Litre variant before it can be saved.');
  const { error: saveError } = await db.from('homepage_banners').upsert(banner, { onConflict: 'id', ignoreDuplicates: true });
  if (saveError) throw new Error(`Could not save the Martell banner: ${saveError.message}`);
  // A separate public marker lets the storefront respect later hiding/deletion.
  const { error: markerError } = await db.from('store_settings').upsert({
    key: MARTELL_REGISTRATION_KEY, value: { registered: true },
    description: 'Martell promotion is now managed in homepage banners', is_public: true,
  });
  if (markerError) throw new Error(`Martell banner saved, but registration could not finish: ${markerError.message}`);
}
