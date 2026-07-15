import { ProductCard } from '@/components/Site';
import { getCategories, getProductsByCategory } from '@/lib/supabase';

export async function generateStaticParams() { const categories = await getCategories(); return categories.map((category) => ({ slug: category.slug })); }
export default async function Category({ params }: { params: { slug: string } }) {
  const list = await getProductsByCategory(params.slug);
  const title = params.slug.replace('-', ' ');
  return <main className="mx-auto max-w-none px-4 py-8"><div className="rounded-3xl bg-white p-6 shadow-card"><p className="font-bold uppercase tracking-wide text-brand-orange">Category</p><h1 className="text-4xl font-black capitalize text-brand-ink sm:text-6xl">{title}</h1><div className="mt-6 grid gap-3 md:grid-cols-5"><input className="rounded-xl border border-orange-100 bg-brand-soft p-3 outline-brand-orange" placeholder="Filter products" /><select className="rounded-xl border border-orange-100 bg-white p-3"><option>Sort by relevance</option><option>Price low to high</option><option>Price high to low</option></select></div></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-8">{list.map((product) => <ProductCard key={product.id} p={product} />)}</div></main>;
}
