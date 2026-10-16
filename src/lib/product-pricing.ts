export type PricingDraft = { price?: unknown; sale_price?: unknown; discount_enabled?: unknown };

export function productPricing(draft: PricingDraft): { price: number; old_price: number | null } {
  const normal = Math.round(Number(draft.price) * 100) / 100;
  if (draft.price === '' || draft.price == null || !Number.isFinite(normal) || normal < 0) throw new Error('Enter a valid normal price of zero or more.');
  if (!draft.discount_enabled) return { price: normal, old_price: null };
  const sale = Math.round(Number(draft.sale_price) * 100) / 100;
  if (draft.sale_price === '' || draft.sale_price == null || !Number.isFinite(sale) || sale < 0 || sale >= normal) throw new Error('The discounted price must be zero or more and lower than the normal price.');
  return { price: Math.round(sale * 100) / 100, old_price: normal };
}
