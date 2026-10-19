import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

async function load(path, dependencies = {}) {
  const code = ts.transpileModule(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = {};
  new Function('exports', 'require', code)(result, name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  return result;
}

test('every new order atomically queues one owner email without requiring a customer email', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create table public.orders(id uuid primary key, customer_email text, status text default 'pending');
      create table public.notification_deliveries(
        id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id),
        channel text, recipient text, event_key text, status text,
        unique(order_id,channel,recipient,event_key)
      );
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20261019130000_admin_order_email.sql', import.meta.url), 'utf8'));
    const id = '11111111-1111-4111-8111-111111111111';
    await db.query('insert into public.orders(id) values ($1)', [id]);
    await db.query('insert into public.orders(id) values ($1) on conflict do nothing', [id]);
    await db.query("update public.orders set status='confirmed' where id=$1", [id]);
    let { rows } = await db.query('select order_id,channel,recipient,event_key,status from public.notification_deliveries');
    assert.deepEqual(rows, [{ order_id: id, channel: 'email', recipient: 'evancekirigia@gmail.com', event_key: 'order_new_order_admin', status: 'pending' }]);
    await db.exec('begin');
    await db.query('insert into public.orders(id) values ($1)', ['22222222-2222-4222-8222-222222222222']);
    await db.exec('rollback');
    assert.equal((await db.query('select count(*)::int as count from public.notification_deliveries')).rows[0].count, 1, 'failed orders must not queue owner emails');
    // The trigger covers every insertion path (including party-package orders), not one RPC.
    await db.query('insert into public.orders(id,customer_email) values ($1,$2)', ['33333333-3333-4333-8333-333333333333', 'customer@example.com']);
    assert.equal((await db.query('select count(*)::int as count from public.notification_deliveries')).rows[0].count, 2);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.notification_deliveries'), /permission denied/);
  } finally { await db.close(); }
});

test('Resend uses the configured sender, owner recipient and stable retry identity', async () => {
  const config = { configured: true, apiKey: 'test-only-placeholder', from: 'Chupa Hub <orders@example.com>', missing: [] };
  const { deliverEmail } = await load('src/lib/server/resend-email.ts', { '@/lib/server/email-config': { getEmailConfig: () => config } });
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    globalThis.fetch = async (url, options) => {
      requests.push({ url, ...options });
      return requests.length === 1 ? new Response(JSON.stringify({ message: 'Transient test failure' }), { status: 500 }) : new Response(JSON.stringify({ id: 'test-message' }), { status: 200 });
    };
    const result = await deliverEmail('evancekirigia@gmail.com', 'New Chupa Hub order TEST', '<p>Test fixture</p>', 'notification-test-id');
    assert.equal(result.status, 'sent');
    assert.equal(result.attempts, 2);
    assert.equal(requests[0].url, 'https://api.resend.com/emails');
    assert.deepEqual(JSON.parse(requests[1].body).to, ['evancekirigia@gmail.com']);
    assert.equal(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
    config.configured = false;
    assert.equal((await deliverEmail('evancekirigia@gmail.com', 'Test', 'Test')).status, 'not_configured');
    assert.equal(requests.length, 2, 'no external request without email configuration');
  } finally { globalThis.fetch = originalFetch; }
});

test('worker targets the new order, recovers unconfigured deliveries, and claims before sending', async () => {
  const delivery = { id: 'delivery-id', order_id: 'order-id', recipient: 'evancekirigia@gmail.com', event_key: 'order_new_order_admin', attempts: 0 };
  const operations = [];
  let claimed = false;
  let sends = 0;
  const db = { from(table) {
    const operation = { table, filters: [], update: null }; operations.push(operation);
    const builder = {
      select() { return builder; }, eq(key, value) { operation.filters.push([key, value]); return builder; },
      in(key, value) { operation.filters.push([key, value]); return builder; }, lt() { return builder; }, order() { return builder; },
      update(value) { operation.update = value; return builder; },
      async limit() { return { data: [delivery], error: null }; },
      async maybeSingle() {
        if (table === 'orders') return { data: { id: 'order-id', order_number: 'TEST', customer_name: 'Test Customer', payment_method: 'cash', subtotal: 100, delivery_fee: 0, total: 100, order_items: [] } };
        const data = claimed ? null : { id: delivery.id }; claimed = true; return { data };
      },
      then(resolve) { return Promise.resolve({ error: null }).then(resolve); }
    };
    return builder;
  } };
  const { processPendingNotifications } = await load('src/lib/server/notification-worker.ts', {
    '@/lib/server/supabase-admin': { getAdminSupabase: () => db },
    '@/lib/server/order-email': { orderEmailHtml: () => '<p>Test order</p>' },
    '@/lib/server/resend-email': { deliverEmail: async (recipient, subject, html, key) => {
      assert.equal(recipient, 'evancekirigia@gmail.com'); assert.match(subject, /New Chupa Hub order/);
      assert.equal(key, 'notification-delivery-id'); sends++; return { status: 'sent', attempts: 1, reference: 'test-only' };
    } }
  });
  assert.deepEqual(await processPendingNotifications(5, 'order-id'), { processed: 1, sent: 1, failed: 0 });
  assert.ok(operations[0].filters.some(([key, value]) => key === 'order_id' && value === 'order-id'));
  assert.ok(operations[0].filters.some(([key, value]) => key === 'status' && value.includes('not_configured')));
  await processPendingNotifications(5, 'order-id');
  assert.equal(sends, 1, 'a competing worker cannot send an already-claimed notification');
});

test('customer email design preserves accurate order details and escapes customer content', async () => {
  const { orderEmailHtml } = await load('src/lib/server/order-email.ts', { '@/lib/server/resend-email': { deliverEmail() { throw new Error('Template tests must never send email'); } } });
  const order = {
    id: 'sample-order', orderNumber: 'CH-1042', customerName: '<script>unsafe</script>',
    deliveryAddress: 'Westlands & Parklands', paymentMethod: 'mpesa',
    subtotal: 5000, deliveryFee: 250, total: 4750, estimatedDelivery: 'Delivery estimate will follow',
    items: [{ name: 'Whisky <Reserve>', quantity: 2, unitPrice: 2500, lineTotal: 5000 }],
    riderName: 'Sample Rider', riderPhone: '+254700000000',
  };
  for (const event of ['placed', 'accepted', 'preparing', 'dispatched', 'delivered', 'cancelled', 'new_order_admin']) {
    const html = orderEmailHtml(order, event);
    assert.match(html, /CHUPA/);
    assert.match(html, /CH-1042/);
    assert.match(html, /KES 4,750\.00/);
    assert.match(html, /KES 500\.00/, 'savings reconcile subtotal, delivery and total');
    assert.match(html, /M-Pesa/);
    assert.match(html, /Whisky &lt;Reserve&gt;/);
    assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /scope="col"/);
    assert.match(html, /max-width:600px/);
    assert.match(html, /\[if mso\]/);
    assert.equal(html.includes('Sample Rider'), event === 'dispatched');
    assert.equal(html.includes('Delivery estimate will follow'), !['delivered', 'cancelled'].includes(event));
    assert.ok(Buffer.byteLength(html) < 100_000, 'normal email stays below Gmail clipping threshold');
    assert.ok(html.includes(event === 'new_order_admin' ? '/admin/orders/sample-order' : 'https://chupahub.com/contact'));
  }
  const normal = orderEmailHtml({ ...order, total: 5250 }, 'placed');
  assert.doesNotMatch(normal, />Savings</);
  assert.doesNotMatch(normal, /paid|Payment confirmed/i, 'confirmation never implies payment has been received');
  const pickup = orderEmailHtml({ ...order, paymentMethod: 'pickup', deliveryAddress: 'Store pickup' }, 'placed');
  assert.match(pickup, /Collection update/);
  assert.doesNotMatch(pickup, /Delivery estimate will follow/);
});
