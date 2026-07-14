export default function Checkout() {
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
        <b className="text-xl text-brand-deep">Delivery Fees</b>
        <p className="mt-4 leading-8 text-neutral-700">0–5 km = KES 150<br />5–10 km = KES 250<br />10–12 km = KES 350<br />Above 12 km = KES 500</p>
        <button className="orange-gradient mt-6 w-full rounded-xl py-4 font-black text-white shadow-orange">Place Order</button>
      </aside>
    </main>
  );
}
