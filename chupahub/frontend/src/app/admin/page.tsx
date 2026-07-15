const items = ['Dashboard', 'Orders', 'Products', 'Categories', 'Brands', 'Customers', 'Sales Reports', 'Inventory', 'Coupons', 'Banners', 'Blog', 'Users', 'Settings', 'Delivery Charges', 'SEO', 'Analytics', 'Drivers', 'Branches'];

export default function Admin() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="font-bold uppercase tracking-wide text-brand-orange">Admin panel</p>
        <h1 className="text-4xl font-black text-brand-ink sm:text-6xl">Modern ChupaHub Admin</h1>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {items.map((item) => <div className="rounded-2xl bg-white p-6 shadow-card" key={item}><b className="text-brand-deep">{item}</b><p className="mt-2 text-sm text-neutral-600">Create, edit, audit and report.</p></div>)}
      </div>
    </main>
  );
}
