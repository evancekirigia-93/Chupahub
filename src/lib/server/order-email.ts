import type { SupabaseClient } from '@supabase/supabase-js';
import { getEmailConfig } from '@/lib/server/email-config';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
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
  dispatchTime?: string | null;
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
  const trackUrl = `${SITE_URL}/account/receipt/${encodeURIComponent(order.id)}`;
  const itemRows = order.items.map(item => `<tr><td style="padding:12px 8px;border-bottom:1px solid #fee2d5;color:#082b57">${escapeHtml(item.name)}</td><td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:center">${item.quantity}</td><td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:right">${money(item.unitPrice)}</td><td style="padding:12px 8px;border-bottom:1px solid #fee2d5;text-align:right;font-weight:700">${money(item.lineTotal)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#fff7f2;font-family:Arial,sans-serif;color:#111827"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(copy.message)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f2"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(8,43,87,.10)"><tr><td style="padding:24px;background:linear-gradient(135deg,#ef2415,#ff681c);color:#fff"><div style="font-size:28px;font-weight:900;letter-spacing:-1px">Chupa<span style="color:#082b57">Hub</span></div><div style="margin-top:4px;font-size:13px">Fast, responsible drinks delivery</div></td></tr><tr><td style="padding:28px"><p style="margin:0;color:#ff4b18;font-size:12px;font-weight:800;text-transform:uppercase">Order ${escapeHtml(order.orderNumber)}</p><h1 style="margin:8px 0 10px;color:#082b57;font-size:28px">${escapeHtml(copy.heading)}</h1><p style="margin:0 0 20px;line-height:1.6">Hi ${escapeHtml(order.customerName || 'there')}, ${escapeHtml(copy.message)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px"><thead><tr style="background:#fff3eb;color:#082b57"><th align="left" style="padding:10px 8px">Item</th><th style="padding:10px 8px">Qty</th><th align="right" style="padding:10px 8px">Price</th><th align="right" style="padding:10px 8px">Total</th></tr></thead><tbody>${itemRows}</tbody></table><table role="presentation" width="100%" style="margin-top:18px;font-size:14px"><tr><td>Subtotal</td><td align="right">${money(order.subtotal)}</td></tr><tr><td>Delivery</td><td align="right">${money(order.deliveryFee)}</td></tr><tr><td style="padding-top:8px;font-size:18px;font-weight:800;color:#082b57">Order total</td><td align="right" style="padding-top:8px;font-size:18px;font-weight:800;color:#082b57">${money(order.total)}</td></tr></table><div style="margin-top:22px;padding:16px;border-radius:14px;background:#fff7f2;line-height:1.6"><strong style="color:#082b57">Delivery address</strong><br>${escapeHtml(order.deliveryAddress)}<br><strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}<br><strong>Estimated delivery:</strong> ${escapeHtml(order.estimatedDelivery)}${order.dispatchTime ? `<br><strong>Dispatched:</strong> ${escapeHtml(order.dispatchTime)}` : ''}${order.riderName ? `<br><strong>Rider:</strong> ${escapeHtml(order.riderName)}${order.riderPhone ? ` · ${escapeHtml(order.riderPhone)}` : ''}` : ''}</div><div style="text-align:center;margin-top:26px"><a href="${trackUrl}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#ff4b18;color:#fff;text-decoration:none;font-weight:800">Track order</a></div><p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.5">Customers must be 18 or older. Please drink responsibly.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmailWithResend(recipient: string, subject: string, html: string) {
  const config = getEmailConfig();
  if (!config.configured || !config.apiKey || !config.from) return { status: 'not_configured' as const, attempts: 0, error: `Email provider not configured. Missing: ${config.missing.join(', ') || 'EMAIL_PROVIDER=resend'}` };
  let lastError = 'Email delivery failed';
  let attempts = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    try {
      const response = await fetch(RESEND_ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: config.from, to: [recipient], subject, html }) });
      const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string; statusCode?: number; code?: string };
      if (response.ok) return { status: 'sent' as const, attempts: attempt, reference: payload.id };
      lastError = payload.message || `Resend returned HTTP ${response.status}`;
      console.error('[Resend] request rejected', { name: payload.name || 'ResendError', message: lastError, httpStatus: response.status, providerCode: payload.code || null });
      if (response.status !== 429 && response.status < 500) break;
    } catch (error) { lastError = error instanceof Error ? error.message : 'Network error while sending email'; }
    if (attempt < MAX_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, attempt * 300));
  }
  return { status: 'failed' as const, attempts, error: lastError };
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
  const result = await sendEmailWithResend(recipient, copy.subject(order.orderNumber), orderEmailHtml(order, event));
  const attempts = Number(existing?.attempts || 0) + result.attempts;
  const deliveryStatus = result.status === 'not_configured' ? 'failed' : result.status;
  await db.from('notification_deliveries').update({ status: deliveryStatus, attempts, provider_message_id: result.reference || null, error_message: result.error || null, sent_at: result.status === 'sent' ? new Date().toISOString() : null }).eq('id', deliveryId);
  const details = { orderId: order.id, event, recipient, status: result.status, attempts, providerReference: result.reference || null, error: result.error || null };
  if (result.status === 'sent') console.info('[Order email] delivered', details); else console.error('[Order email] failed', details);
  return result;
}
