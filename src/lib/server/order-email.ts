import type { SupabaseClient } from '@supabase/supabase-js';
import { deliverEmail } from '@/lib/server/resend-email';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 3;

export type OrderEmailEvent = 'placed' | 'accepted' | 'preparing' | 'dispatched' | 'delivered' | 'cancelled' | 'new_order_admin';
export type EmailOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDelivery: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
  riderName?: string | null;
  riderPhone?: string | null;
};

const eventCopy: Record<OrderEmailEvent, { subject: (number: string) => string; heading: string; message: string }> = {
  placed: { subject: number => `Order ${number} received`, heading: 'Thanks for your order', message: 'We received your order and will update you as it moves through delivery.' },
  accepted: { subject: number => `Order ${number} accepted`, heading: 'Your order is accepted', message: 'The ChupaHub team has accepted your order.' },
  preparing: { subject: number => `Order ${number} is being prepared`, heading: 'We are preparing your order', message: 'Your items are being packed and checked for dispatch.' },
  dispatched: { subject: number => `Order ${number} is on the way`, heading: 'Your rider is on the way', message: 'Your order has left ChupaHub and is heading to you.' },
  delivered: { subject: number => `Order ${number} delivered`, heading: 'Your order was delivered', message: 'Thank you for choosing ChupaHub. We hope you enjoy your order responsibly.' },
  cancelled: { subject: number => `Order ${number} cancelled`, heading: 'Your order was cancelled', message: 'Your order has been cancelled. Contact ChupaHub customer care if you need help.' },
  new_order_admin: { subject: number => `New ChupaHub order ${number}`, heading: 'New order placed', message: 'A new customer order needs attention.' },
};

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const money = (value: number) => `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function orderEmailHtml(order: EmailOrder, event: OrderEmailEvent) {
  const copy = eventCopy[event];

  const eventDetails: Array<[string, string]> = [];
  if (order.paymentStatus) eventDetails.push(['Payment status', order.paymentStatus.replaceAll('_', ' ')]);
  if (order.dispatchTime) eventDetails.push(['Dispatched', order.dispatchTime]);
  if (order.riderName || order.riderPhone) eventDetails.push(['Rider', [order.riderName, order.riderPhone].filter(Boolean).join(' — ')]);
  if (order.cancellationReason) eventDetails.push(['Cancellation reason', order.cancellationReason]);
  if (event === 'order_cancelled') eventDetails.push(['Support', order.supportContact || 'orders@chupahub.com']);
  const eventDetailsHtml = eventDetails.length
    ? `<div style="margin:16px 0;padding:14px;border-radius:10px;background:#fff7f2;line-height:1.7">${eventDetails.map(([label, value]) => `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`).join('')}</div>`
    : '';

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #fee2d5;color:#082b57">${escapeHtml(item.name)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:center">${escapeHtml(item.quantity)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:right">${escapeHtml(money(item.unitPrice))}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:right;font-weight:700">${escapeHtml(money(item.lineTotal))}</td>
    </tr>`).join('');
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#fff7f2;font-family:Arial,sans-serif;color:#111827">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.message)}</div>
    <div style="max-width:700px;margin:24px auto;padding:24px;background:#fff;border-radius:12px">
      <div style="font-size:26px;font-weight:900;color:#ff4b18">Chupa<span style="color:#082b57">Hub</span></div>
      <p style="margin:20px 0 0;color:#ff4b18;font-size:12px;font-weight:700;text-transform:uppercase">Order ${escapeHtml(order.orderNumber)}</p>
      <h1 style="font-size:24px;color:#082b57;margin:8px 0">${escapeHtml(copy.heading)}</h1>
      <p style="margin:0 0 12px">Hi ${escapeHtml(order.customerName || 'there')}, ${escapeHtml(copy.message)}</p>
      ${eventDetailsHtml}
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px">
        <thead><tr style="background:#fff1e6;color:#082b57"><th style="padding:10px 8px;text-align:left">Item</th><th style="padding:10px 8px">Qty</th><th style="padding:10px 8px;text-align:right">Price</th><th style="padding:10px 8px;text-align:right">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table role="presentation" style="width:100%;margin-top:18px;font-size:14px"><tbody>
        <tr><td>Subtotal</td><td style="text-align:right">${escapeHtml(money(order.subtotal))}</td></tr>
        <tr><td>Delivery</td><td style="text-align:right">${escapeHtml(money(order.deliveryFee))}</td></tr>
        <tr><td style="padding-top:8px;font-size:18px;font-weight:700;color:#082b57">Order total</td><td style="padding-top:8px;text-align:right;font-size:18px;font-weight:700;color:#082b57">${escapeHtml(money(order.total))}</td></tr>
      </tbody></table>
      <div style="margin-top:20px;padding:14px;border-radius:10px;background:#fff7f2;line-height:1.7"><strong style="color:#082b57">Delivery address</strong><br>${escapeHtml(order.deliveryAddress)}<br><strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}<br><strong>Estimated delivery:</strong> ${escapeHtml(order.estimatedDelivery)}</div>
      <p style="margin:24px 0 0;color:#6b7280;font-size:12px">Customers must be 18 or older. Please drink responsibly.</p>
    </div>
  </body>
</html>`;
}

export async function sendOrderEmail(db: SupabaseClient, order: EmailOrder, event: OrderEmailEvent, recipient: string) {
  if (!recipient) return { status: 'skipped' as const, reason: 'No recipient' };
  const eventKey = `order_${event}`;
  const { data: existing } = await db.from('notification_deliveries').select('id,status,attempts').eq('order_id', order.id).eq('channel', 'email').eq('recipient', recipient).eq('event_key', eventKey).maybeSingle();
  if (existing?.status === 'sent' || existing?.status === 'pending') {
    console.info('[Order email] duplicate skipped', { orderId: order.id, event, recipient, status: existing.status });
    return { status: 'skipped' as const, reason: `Already ${existing.status}` };
  }
  if (existing && Number(existing.attempts) >= MAX_ATTEMPTS) return { status: 'skipped' as const, reason: 'Retry limit reached' };
  let deliveryId = existing?.id as string | undefined;
  if (deliveryId) await db.from('notification_deliveries').update({ status: 'pending', error_message: null }).eq('id', deliveryId);
  else {
    const { data: claimed, error } = await db.from('notification_deliveries').insert({ order_id: order.id, channel: 'email', recipient, event_key: eventKey, status: 'pending', attempts: 0 }).select('id').single();
    if (error || !claimed) {
      console.info('[Order email] duplicate claim skipped', { orderId: order.id, event, recipient });
      return { status: 'skipped' as const, reason: 'Another request claimed this email' };
    }
    deliveryId = claimed.id;
  }
  const copy = eventCopy[event];
  const result = await deliverEmail(recipient, copy.subject(order.orderNumber), orderEmailHtml(order, event));
  const attempts = Number(existing?.attempts || 0) + result.attempts;
  await db.from('notification_deliveries').update({ status: result.status, attempts, provider_message_id: result.reference || null, error_message: result.error || null, sent_at: result.status === 'sent' ? new Date().toISOString() : null }).eq('id', deliveryId);
  const details = { orderId: order.id, event, recipient, status: result.status, attempts, providerReference: result.reference || null, error: result.error || null };
  if (result.status === 'sent') console.info('[Order email] delivered', details); else console.error('[Order email] failed', details);
  return result;
}
