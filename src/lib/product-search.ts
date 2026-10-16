import type { DbProduct } from './supabase';

const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) {
      next.push(Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)));
    }
    row = next;
  }
  return row[b.length];
}

export function searchProducts(products: DbProduct[], query: string): DbProduct[] {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  return products.map(product => {
    const name = normalize(product.name);
    const text = normalize([product.name, product.brands?.name, product.categories?.name, product.description, product.bottle_size, ...(product.product_variants || []).map(variant => variant.name)].filter(Boolean).join(' '));
    const tokens = text.split(' ');
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) {
        score += name === word ? 20 : name.startsWith(word) ? 10 : name.includes(word) ? 6 : 3;
      } else {
        const tolerance = word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;
        if (!tolerance || !tokens.some(token => Math.abs(token.length - word.length) <= tolerance && distance(word, token) <= tolerance)) return { product, score: -1 };
        score += 1;
      }
    }
    return { product, score };
  }).filter(result => result.score >= 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .map(result => result.product);
}
