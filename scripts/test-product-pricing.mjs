import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';

const compiled = ts.transpileModule(readFileSync(new URL('../src/lib/product-pricing.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const { productPricing } = exports;
assert.deepEqual(productPricing({ price: '2000', sale_price: '1800', discount_enabled: true }), { price: 1800, old_price: 2000 });
assert.deepEqual(productPricing({ price: '2000', sale_price: '1800', discount_enabled: false }), { price: 2000, old_price: null }, 'Removing a discount restores the normal price');
assert.deepEqual(productPricing({ price: '1000', sale_price: '0', discount_enabled: true }), { price: 0, old_price: 1000 });
assert.deepEqual(productPricing({ price: '1234.56', sale_price: '1111.10', discount_enabled: true }), { price: 1111.1, old_price: 1234.56 });
assert.deepEqual(productPricing({ price: '0', discount_enabled: false }), { price: 0, old_price: null });
for (const price of ['', undefined, 'bad', '-1', Infinity]) assert.throws(() => productPricing({ price }));
for (const sale_price of ['', undefined, 'bad', '-1', '2000', '3000', '1999.999']) assert.throws(() => productPricing({ price: 2000, sale_price, discount_enabled: true }));
console.log('Product pricing checks passed: normal prices, discounts, removal, zero prices, precision and invalid prices.');

const require = createRequire(import.meta.url);
const ui = {};
const uiCode = ts.transpileModule(readFileSync(new URL('../src/components/admin/ProductPricingFields.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
new Function('exports', 'require', uiCode)(ui, name => name === '@/lib/supabase' ? { money: value => `KES ${value}` } : require(name));
function inputs(node) {
  if (!node || typeof node !== 'object') return [];
  const children = node.props?.children;
  return [...(node.type === 'input' ? [node] : []), ...[children].flat(Infinity).flatMap(inputs)];
}
let draft = { price: '1000', sale_price: '800', discount_enabled: true };
const render = () => inputs(ui.ProductPricingFields({ value: draft, onChange: change => { draft = { ...draft, ...change }; } }));
render()[0].props.onChange({ target: { value: '2000' } });
assert.equal(draft.sale_price, '1600', 'Changing the normal price preserves the discount percentage');
render()[2].props.onChange({ target: { value: '10' } });
assert.equal(draft.sale_price, '1800', 'Entering a percentage updates the sale price');
render()[3].props.onChange({ target: { value: '1500' } });
assert.equal(render()[2].props.value, 25, 'Entering a sale price updates the percentage');
render()[1].props.onChange({ target: { checked: false } });
assert.deepEqual(productPricing(draft), { price: 2000, old_price: null });
console.log('Price-form interaction checks passed: percentage, sale price, normal-price changes and discount removal.');
