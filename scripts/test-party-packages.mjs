import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../src/lib/party-packages.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const { pricePartyPackage, parsePartyPackages, emptyPartyPackages } = exports;
const products = [
  { id: 'a', name: 'Bottle A', price: 2000, stock: 12, is_active: true },
  { id: 'b', name: 'Bottle B', price: 1000, stock: 8, product_variants: [{ id: 'large', name: '1L', price: 3500, stock: 3, is_active: true }] },
];
const bundle = { id: 1, name: 'Package 1', is_active: true, description: '', items: [{ productId: 'a', quantity: 2 }, { productId: 'b', variantId: 'large', quantity: 1 }] };
const priced = pricePartyPackage(bundle, products);
assert.equal(priced.subtotal, 7500);
assert.equal(priced.discount, 750);
assert.equal(priced.total, 6750);
assert.equal(priced.available, true);
assert.equal(priced.items[1].size, '1L');
assert.equal(products[0].price, 2000, 'Normal product prices must remain unchanged');
assert.equal(pricePartyPackage({ ...bundle, is_active: false }, products).available, false);
assert.equal(pricePartyPackage({ ...bundle, items: [] }, products).available, false);
assert.equal(pricePartyPackage(bundle, products.slice(1)).available, false);
assert.equal(pricePartyPackage(bundle, [{ ...products[0], stock: 1 }, products[1]]).available, false);
assert.equal(pricePartyPackage(bundle, [products[0], { ...products[1], product_variants: [] }]).available, false);
assert.equal(pricePartyPackage(bundle, [{ ...products[0], is_active: false }, products[1]]).available, false);
const rounded = pricePartyPackage({ ...bundle, items: [{ productId: 'a', quantity: 1 }] }, [{ ...products[0], price: 1234.56 }]);
assert.equal(rounded.discount, 123.46);
assert.equal(rounded.total, 1111.1);
assert.equal(emptyPartyPackages().length, 4);
assert.deepEqual(parsePartyPackages(null), emptyPartyPackages());
assert.equal(parsePartyPackages([{ id: 1, is_active: true, items: [{ productId: 'a', quantity: -1 }] }])[0].items.length, 0);
console.log('Party package pricing, variants, rounding, publication and availability checks passed.');
