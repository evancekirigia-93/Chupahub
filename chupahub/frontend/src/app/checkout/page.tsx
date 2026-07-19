import { CartSummary } from '@/components/CartSummary';
import { getDeliverySettings, money } from '@/lib/supabase';

export default async function Checkout() {
  const settings = await getDeliverySettings();
  const rows = ['Cart', 'Suggested products', 'Coupon or gift voucher', 'Gift note', 'Delivery address', 'Live map GPS pin', 'Payment: M-Pesa, Cash, Visa, Mastercard, Bank Transfer'];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
      <section className="rounded-3xl bg-white p-6 shadow-card lg:col-span-2">
        <p className="font-bold uppercase tracking-wide text-brand-orange">Supermarket checkout</p>
        <h1 className="text-4xl font-black text-brand-ink">Checkout</h1>
        {rows.map((row) => <div className="border-b border-orange-100 py-5 font-semibold" key={row}>{row}</div>)}
        <div className="mt-5 flex h-72 items-center justify-center rounded-2xl bg-[radial-gradient(circle,#f05a1a_1px,transparent_1px)] text-center font-black text-brand-deep [background-size:24px_24px]">Google Maps routing and driver ETA panel</div>
      </section>
      <aside className="rounded-3xl bg-white p-6 shadow-card">
        <b className="text-xl text-brand-deep">Your cart</b><CartSummary /><b className="mt-6 block text-xl text-brand-deep">Delivery Fees</b>
        <div className="mt-4 space-y-3 text-neutral-700">
          {settings.length ? settings.map((setting) => <div key={setting.id} className="flex justify-between border-b border-orange-100 pb-2"><span>{setting.name}</span><strong>{money(setting.fee)}</strong></div>) : <p>Delivery fees are confirmed from your location at checkout.</p>}
        </div>
        <button className="orange-gradient mt-6 w-full rounded-xl py-4 font-black text-white shadow-orange">Place Order</button>
      </aside>
    </main>
  );
}
