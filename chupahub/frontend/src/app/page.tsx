import Link from 'next/link';
import { CategoryGrid, ProductRail } from '@/components/Site';
import { slides } from '@/lib/data';

export default function Home() {
  const hero = slides[0];

  return (
    <main>
      <section className="mx-auto max-w-6xl overflow-hidden bg-white shadow-card sm:mt-4 sm:rounded-3xl">
        <div className="relative h-48 sm:h-80">
          <img src={hero.image} alt="ChupaHub promotion" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
          <div className="absolute right-4 top-4 rotate-[-8deg] rounded-xl bg-yellow-300 px-4 py-3 text-center text-2xl font-black uppercase leading-none text-black shadow-card sm:text-5xl">
            Buy 1<br />Get 1<br />Free
          </div>
          <div className="absolute bottom-5 left-5 max-w-md text-white">
            <p className="font-bold uppercase tracking-wide">Orange deals every day</p>
            <h1 className="text-3xl font-black sm:text-5xl">{hero.title}</h1>
            <p className="mt-2 hidden text-white/90 sm:block">{hero.description}</p>
            <Link href={hero.href} className="mt-4 inline-block rounded-lg bg-brand-deep px-5 py-3 font-black uppercase text-white shadow-card">{hero.cta}</Link>
          </div>
        </div>
      </section>

      <CategoryGrid />

      <ProductRail title="Top Sellers" />
      <ProductRail title="New Arrivals" />
      <ProductRail title="Customers also bought" />
      <ProductRail title="Party Offers" />

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-6 shadow-card"><b className="text-brand-deep">WhatsApp ordering</b><p className="mt-2 text-neutral-600">Start an assisted order in one tap and complete checkout by M-Pesa.</p></article>
        <article className="rounded-2xl bg-white p-6 shadow-card"><b className="text-brand-deep">Live tracking</b><p className="mt-2 text-neutral-600">Track packing, driver assignment and delivery ETA in real time.</p></article>
        <article className="rounded-2xl bg-white p-6 shadow-card"><b className="text-brand-deep">Loyalty rewards</b><p className="mt-2 text-neutral-600">Earn points on every order and redeem vouchers on future purchases.</p></article>
      </section>
    </main>
  );
}
