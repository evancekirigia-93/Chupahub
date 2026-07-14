import { ProductCard } from '@/components/Site';
import { categories, products } from '@/lib/data';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default function Category({ params }: { params: { slug: string } }) {
  const matchingProducts = products.filter((product) => product.category === params.slug);
  const list = matchingProducts.length ? matchingProducts : products;
  const category = categories.find((item) => item.slug === params.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="font-bold uppercase tracking-wide text-brand-orange">Category</p>
        <h1 className="text-4xl font-black text-brand-ink sm:text-6xl">{category?.name || params.slug.replace('-', ' ')}</h1>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          <input className="rounded-xl border border-orange-100 bg-brand-soft p-3 outline-brand-orange" placeholder="Filter products" />
          <select className="rounded-xl border border-orange-100 bg-white p-3"><option>Sort by relevance</option><option>Price low to high</option><option>Price high to low</option></select>
          <select className="rounded-xl border border-orange-100 bg-white p-3"><option>Brand</option></select>
          <select className="rounded-xl border border-orange-100 bg-white p-3"><option>Country</option></select>
          <select className="rounded-xl border border-orange-100 bg-white p-3"><option>Bottle size</option></select>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {list.map((product) => <ProductCard key={product.id} p={product} />)}
      </div>
    </main>
  );
}
