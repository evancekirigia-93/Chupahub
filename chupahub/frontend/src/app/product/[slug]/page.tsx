import { ProductRail } from '@/components/Site';
import { money, products } from '@/lib/data';

export default function Product({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.slug === params.slug) || products[0];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: product.brand,
            offers: { price: product.price, priceCurrency: 'KES', availability: 'https://schema.org/InStock' },
          }),
        }}
      />
      <section className="grid gap-8 rounded-3xl bg-white p-5 shadow-card md:grid-cols-2 md:p-8">
        <div className="grid grid-cols-2 gap-3">
          {product.images.map((image) => <img key={image} src={image} alt={product.name} className="h-72 w-full rounded-2xl object-cover" />)}
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-brand-orange">{product.brand}</p>
          <h1 className="mt-2 text-4xl font-black text-brand-ink sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-neutral-600">{product.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-brand-soft p-4 text-sm">
            <dt className="font-bold">ABV</dt><dd>{product.abv}%</dd>
            <dt className="font-bold">Country</dt><dd>{product.country}</dd>
            <dt className="font-bold">Bottle Size</dt><dd>{product.bottleSize}</dd>
            <dt className="font-bold">Stock</dt><dd>{product.stock}</dd>
          </dl>
          <div className="mt-6 text-4xl font-black text-brand-deep">{money(product.price)}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="orange-gradient rounded-xl px-8 py-4 font-black text-white shadow-orange">Add to Cart</button>
            <button className="rounded-xl border-2 border-brand-orange px-8 py-4 font-black text-brand-orange">Buy Now</button>
            <button className="rounded-xl bg-brand-soft px-6 py-4 font-bold text-brand-ink">Share</button>
          </div>
          <p className="mt-5 font-semibold text-brand-orange">Delivery estimate: 10–50 minutes within Nairobi after GPS checkout.</p>
        </div>
      </section>
      <ProductRail title="Customers also bought" />
      <ProductRail title="Recently Viewed" />
    </main>
  );
}
