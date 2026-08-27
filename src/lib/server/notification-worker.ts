import { getAdminSupabase } from '@/lib/server/supabase-admin';
import { deliverEmail } from '@/lib/server/resend-email';
import { orderEmailHtml, type EmailOrder, type OrderEmailEvent } from '@/lib/server/order-email';

export async function processPendingNotifications(limit=20){
  const db=getAdminSupabase();
  const {data:deliveries,error}=await db.from('notification_deliveries').select('id,order_id,recipient,event_key,attempts').eq('channel','email').in('status',['pending','failed']).lt('attempts',3).order('created_at').limit(limit);
  if(error)throw error;
  let sent=0,failed=0;
  for(const delivery of deliveries||[]){
    const {data:claimed}=await db.from('notification_deliveries').update({status:'processing'}).eq('id',delivery.id).in('status',['pending','failed']).select('id').maybeSingle();
    if(!claimed)continue;
    const {data:order}=await db.from('orders').select('id,order_number,customer_name,customer_email,customer_phone,delivery_address,payment_method,subtotal,delivery_fee,total,rider_name,rider_phone,order_items(product_name,quantity,unit_price,line_total)').eq('id',delivery.order_id).maybeSingle();
    if(!order){await db.from('notification_deliveries').update({status:'failed',attempts:Number(delivery.attempts)+1,error_message:'Order not found'}).eq('id',delivery.id);failed++;continue;}
    const event:OrderEmailEvent=delivery.event_key==='order_dispatched'?'dispatched':delivery.event_key==='order_placed'?'placed':'new_order_admin';
    const emailOrder:EmailOrder={id:order.id,orderNumber:order.order_number,customerName:order.customer_name||'Customer',customerEmail:order.customer_email,customerPhone:order.customer_phone,deliveryAddress:order.delivery_address||'Delivery address on order',paymentMethod:order.payment_method,subtotal:Number(order.subtotal),deliveryFee:Number(order.delivery_fee),total:Number(order.total),estimatedDelivery:event==='dispatched'?'Your rider is on the way':'Delivery estimate will follow',riderName:order.rider_name,riderPhone:order.rider_phone,items:(order.order_items||[]).map(item=>({name:item.product_name,quantity:Number(item.quantity),unitPrice:Number(item.unit_price),lineTotal:Number(item.line_total)}))};
    const subject=event==='dispatched'?`Order ${order.order_number} is on the way`:event==='placed'?`Order ${order.order_number} received`:`New Chupa Hub order ${order.order_number}`;
    const result=await deliverEmail(delivery.recipient,subject,orderEmailHtml(emailOrder,event));
    await db.from('notification_deliveries').update({status:result.status,attempts:Number(delivery.attempts)+result.attempts,provider_message_id:result.reference||null,error_message:result.error||null,sent_at:result.status==='sent'?new Date().toISOString():null}).eq('id',delivery.id);
    result.status==='sent'?sent++:failed++;
  }
  return {processed:(deliveries||[]).length,sent,failed};
}
