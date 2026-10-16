import type { DbProduct } from './supabase';

export type PartyItem = { productId: string; variantId?: string; quantity: number };
export type PartyPackage = { id: number; name: string; description: string; is_active: boolean; items: PartyItem[] };
export const emptyPartyPackages = (): PartyPackage[] => Array.from({ length: 4 }, (_, index) => ({ id: index + 1, name: `Package ${index + 1}`, description: ['A little gathering, a great selection.', 'Bring your favourites to the table.', 'More friends. More to celebrate.', 'Make it a night to remember.'][index], is_active: false, items: [] }));

export function parsePartyPackages(value: unknown): PartyPackage[] {
  if (!Array.isArray(value)) return emptyPartyPackages();
  return emptyPartyPackages().map(fallback => {
    const saved = value.find(item => item && item.id === fallback.id);
    if (!saved) return fallback;
    return { ...fallback, name: typeof saved.name === 'string' ? saved.name : fallback.name, description: typeof saved.description === 'string' ? saved.description : '', is_active: saved.is_active === true, items: Array.isArray(saved.items) ? saved.items.filter((item: PartyItem) => item && typeof item.productId === 'string' && (!item.variantId || typeof item.variantId === 'string') && Number.isInteger(item.quantity) && item.quantity > 0) : [] };
  });
}

export function pricePartyPackage(bundle: PartyPackage, products: DbProduct[]) {
  const items = bundle.items.map(line => {
    const product = products.find(product => product.id === line.productId && product.is_active !== false);
    if (!product) return null;
    const variant = line.variantId ? product.product_variants?.find(variant => variant.id === line.variantId && variant.is_active !== false) : undefined;
    if (line.variantId && !variant) return null;
    const price = Number(variant?.price ?? product.price);
    if (!Number.isFinite(price) || price < 0) return null;
    return { ...line, name: product.name, size: variant?.name || product.bottle_size, price, image: variant?.image_url || product.image_url, stock: variant?.stock ?? product.stock ?? 0 };
  });
  const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);
  const subtotal = Math.round(validItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const discount = Math.round(subtotal * 10) / 100;
  return { ...bundle, items: validItems, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, available: bundle.is_active && new Set(bundle.items.map(item => `${item.productId}:${item.variantId || ''}`)).size === bundle.items.length && items.length > 0 && validItems.length === items.length && validItems.every(item => item.stock >= item.quantity) };
}

export type PricedPartyPackage = ReturnType<typeof pricePartyPackage>;
