import type { SupabaseClient } from '@supabase/supabase-js';
import { deliverEmail } from '@/lib/server/resend-email';

const SITE_URL = 'https://chupahub.com';
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
  accepted: { subject: number => `Order ${number} accepted`, heading: 'Your order is accepted', message: 'The Chupa Hub team has accepted your order.' },
  preparing: { subject: number => `Order ${number} is being prepared`, heading: 'We are preparing your order', message: 'Your items are being packed and checked for dispatch.' },
  dispatched: { subject: number => `Order ${number} is on the way`, heading: 'Your rider is on the way', message: 'Your order has left Chupa Hub and is heading to you.' },
  delivered: { subject: number => `Order ${number} delivered`, heading: 'Your order was delivered', message: 'Thank you for choosing Chupa Hub. We hope you enjoy your order responsibly.' },
  cancelled: { subject: number => `Order ${number} cancelled`, heading: 'Your order was cancelled', message: 'Your order has been cancelled. Contact Chupa Hub customer care if you need help.' },
  new_order_admin: { subject: number => `New Chupa Hub order ${number}`, heading: 'New order placed', message: 'A new customer order needs attention.' },
};

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const money = (value: number) => `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function orderEmailHtml(order: EmailOrder, event: OrderEmailEvent) {
  const copy = eventCopy[event];
  const admin = event === 'new_order_admin';
  const pickup = order.paymentMethod === 'pickup';
  const statusLabels: Record<OrderEmailEvent, string> = {
    placed: 'Order received', accepted: 'Order accepted', preparing: 'Being prepared',
    dispatched: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled', new_order_admin: 'New customer order',
  };
  const paymentLabels: Record<string, string> = { cash: 'Cash on delivery', mpesa: 'M-Pesa', pickup: 'Pay at pickup', card: 'Card' };
  const savings = Math.max(0, Math.round((order.subtotal + order.deliveryFee - order.total) * 100) / 100);
  const rows = order.items.map(item => `<tr>
    <td style="padding:18px 0;border-bottom:1px solid #e9e5df;vertical-align:top;overflow-wrap:anywhere;"><strong style="color:#002653;font-size:15px;line-height:22px;">${escapeHtml(item.name)}</strong><br><span style="color:#77746f;font-size:12px;line-height:22px;">${escapeHtml(money(item.unitPrice))} each</span></td>
    <td align="center" style="padding:18px 8px;border-bottom:1px solid #e9e5df;vertical-align:top;font-size:14px;color:#565650;">${escapeHtml(item.quantity)}</td>
    <td align="right" style="padding:18px 0;border-bottom:1px solid #e9e5df;vertical-align:top;font-size:14px;font-weight:bold;color:#002653;white-space:nowrap;">${escapeHtml(money(item.lineTotal))}</td>
  </tr>`).join('');
  const detail = (label: string, value: string) => `<p style="margin:0 0 7px;font-size:10px;line-height:16px;letter-spacing:1.5px;text-transform:uppercase;color:#77746f;font-weight:bold;">${escapeHtml(label)}</p><p style="margin:0 0 22px;font-size:14px;line-height:23px;color:#002653;overflow-wrap:anywhere;">${escapeHtml(value)}</p>`;
  const buttonUrl = admin ? `${SITE_URL}/admin/orders/${encodeURIComponent(order.id)}` : `${SITE_URL}/contact`;
  const preheader = `${copy.heading}. Order ${order.orderNumber} · ${money(order.total)}. ${copy.message}`;
  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(copy.subject(order.orderNumber))}</title>
<style>body{margin:0;padding:0;}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}a{text-decoration:none;}@media only screen and (max-width:600px){.outer{padding:12px 8px!important;}.pad{padding-left:22px!important;padding-right:22px!important;}.headline{font-size:32px!important;line-height:38px!important;}.detail-column{display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important;}.item-table{font-size:12px!important;}.brand{font-size:20px!important;letter-spacing:3px!important;}}</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f3f1ec;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" bgcolor="#f3f1ec"><tr><td class="outer" align="center" style="padding:40px 16px;">
<!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;" bgcolor="#ffffff">
<tr><td class="pad" style="padding:28px 40px;border-top:4px solid #ff5a00;">
  <table role="presentation" width="100%"><tr><td><a href="${SITE_URL}" class="brand" style="font-size:23px;font-weight:900;letter-spacing:4px;color:#002653;">CHUPA<span style="color:#d84900;"> HUB</span></a></td><td align="right" style="font-size:10px;line-height:16px;letter-spacing:1px;color:#77746f;">NAIROBI<br>WINES &amp; SPIRITS</td></tr></table>
</td></tr>
<tr><td class="pad" bgcolor="#002653" style="padding:34px 40px 38px;background-color:#002653;">
  <p style="margin:0 0 20px;color:#ffb380;font-size:10px;line-height:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(statusLabels[event])}</p>
  <h1 class="headline" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:44px;font-weight:normal;color:#ffffff;">${escapeHtml(copy.heading)}.</h1>
  <p style="margin:0;font-size:14px;line-height:24px;color:#e3eaf2;">${admin ? 'Hello Chupa Hub team,' : `Hello ${escapeHtml(order.customerName || 'there')},`}<br>${escapeHtml(copy.message)}</p>
</td></tr>
<tr><td class="pad" style="padding:23px 40px;background-color:#fcf5ed;border-bottom:1px solid #eee6da;">
  <p style="margin:0 0 5px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:1.5px;color:#77746f;">ORDER REFERENCE</p>
  <p style="margin:0;font-size:19px;line-height:28px;font-weight:bold;color:#002653;overflow-wrap:anywhere;">${escapeHtml(order.orderNumber)}</p>
</td></tr>
<tr><td class="pad" style="padding:30px 40px 10px;">
  <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:30px;font-weight:normal;color:#002653;">Your order, in detail</h2>
  <table class="item-table" width="100%" style="table-layout:fixed;" aria-label="Order items">
    <thead><tr><th scope="col" align="left" width="54%" style="padding:0 0 10px;border-bottom:2px solid #002653;font-size:10px;letter-spacing:1px;color:#77746f;">ITEM</th><th scope="col" width="12%" style="padding:0 4px 10px;border-bottom:2px solid #002653;font-size:10px;letter-spacing:1px;color:#77746f;">QTY</th><th scope="col" align="right" width="34%" style="padding:0 0 10px;border-bottom:2px solid #002653;font-size:10px;letter-spacing:1px;color:#77746f;">AMOUNT</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table role="presentation" width="100%" style="margin-top:16px;">
    <tr><td style="padding:6px 0;font-size:13px;color:#77746f;">Subtotal</td><td align="right" style="padding:6px 0;font-size:13px;color:#002653;">${escapeHtml(money(order.subtotal))}</td></tr>
    ${savings > 0 ? `<tr><td style="padding:6px 0;font-size:13px;color:#366548;">Savings</td><td align="right" style="padding:6px 0;font-size:13px;color:#366548;">&minus; ${escapeHtml(money(savings))}</td></tr>` : ''}
    <tr><td style="padding:6px 0 18px;font-size:13px;color:#77746f;">${pickup ? 'Collection' : 'Delivery'}</td><td align="right" style="padding:6px 0 18px;font-size:13px;color:#002653;">${escapeHtml(money(order.deliveryFee))}</td></tr>
    <tr><td style="padding:17px 0;border-top:2px solid #002653;font-size:16px;font-weight:bold;color:#002653;">Order total</td><td align="right" style="padding:17px 0;border-top:2px solid #002653;font-size:21px;font-weight:bold;color:#002653;">${escapeHtml(money(order.total))}</td></tr>
  </table>
</td></tr>
<tr><td class="pad" style="padding:20px 40px 4px;">
  <table role="presentation" width="100%"><tr>
    <td class="detail-column" width="55%" valign="top" style="padding-right:24px;">${detail(pickup ? 'Collection' : 'Delivering to', order.deliveryAddress)}${detail('Customer', order.customerName)}</td>
    <td class="detail-column" width="45%" valign="top">${detail('Payment method', paymentLabels[order.paymentMethod] || order.paymentMethod)}${!['cancelled', 'delivered'].includes(event) ? detail(pickup ? 'Collection update' : 'Delivery update', pickup ? 'Please contact customer care to confirm collection.' : order.estimatedDelivery) : ''}</td>
  </tr></table>
  ${event === 'dispatched' ? `<table role="presentation" width="100%" bgcolor="#fcf5ed"><tr><td style="padding:20px 22px;">${detail('Your rider', order.riderName || 'Chupa Hub rider')}<p style="margin:0;font-size:14px;line-height:22px;color:#002653;">${escapeHtml(order.riderPhone || 'Contact customer care for rider details.')}</p></td></tr></table>` : ''}
</td></tr>
<tr><td class="pad" style="padding:24px 40px 34px;">
  <table role="presentation"><tr><td bgcolor="#002653" style="border-radius:4px;text-align:center;"><a href="${buttonUrl}" style="display:inline-block;padding:16px 28px;border:1px solid #002653;border-radius:4px;font-size:13px;line-height:18px;font-weight:bold;color:#ffffff;mso-padding-alt:0;"><!--[if mso]><i style="mso-font-width:200%;mso-text-raise:24pt;" hidden>&emsp;</i><![endif]-->${admin ? 'View order in dashboard' : 'Contact customer care'}<!--[if mso]><i style="mso-font-width:200%;" hidden>&emsp;&#8203;</i><![endif]--></a></td></tr></table>
  <p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#77746f;">${admin ? 'Sign in to the admin dashboard to review and manage this order.' : 'Need a hand? Our team can help. Please quote your order reference when contacting us.'}</p>
</td></tr>
<tr><td class="pad" bgcolor="#fcf5ed" style="padding:25px 40px;border-top:1px solid #eee6da;">
  <p style="margin:0 0 7px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:28px;color:#002653;">Thank you for choosing Chupa Hub.</p>
  <p style="margin:0;font-size:12px;line-height:21px;color:#77746f;">Wines, spirits &amp; more. Delivered in Nairobi.<br><a href="${SITE_URL}" style="color:#002653;text-decoration:underline;">chupahub.com</a></p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
<table role="presentation" width="100%" style="max-width:600px;"><tr><td align="center" style="padding:22px 16px;font-size:10px;line-height:18px;color:#77746f;">This is a service update about your Chupa Hub order.<br>For adults 18+ only. Please drink responsibly.</td></tr></table>
</td></tr></table>
</body></html>`;
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
  const result = await deliverEmail(recipient, copy.subject(order.orderNumber), orderEmailHtml(order, event), `notification-${deliveryId}`);
  const attempts = Number(existing?.attempts || 0) + result.attempts;
  await db.from('notification_deliveries').update({ status: result.status, attempts, provider_message_id: result.reference || null, error_message: result.error || null, sent_at: result.status === 'sent' ? new Date().toISOString() : null }).eq('id', deliveryId);
  const details = { orderId: order.id, event, recipient, status: result.status, attempts, providerReference: result.reference || null, error: result.error || null };
  if (result.status === 'sent') console.info('[Order email] delivered', details); else console.error('[Order email] failed', details);
  return result;
}
