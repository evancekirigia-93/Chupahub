import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:NextRequest){
 const token=request.headers.get('authorization')?.replace(/^Bearer\\s+/i,'');
 if(!token)return respond({error:'Sign in as rider'},401);
 const db=getAdminSupabase();
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return respond({error:'Session expired'},401);
 const {data:rider}=await db.from('delivery_riders').select('user_id').eq('user_id',user.id).eq('active',true).maybeSingle();
 if(!rider)return respond({error:'Rider account required'},403);
 const body=await request.json().catch(()=>null) as {orderId?:string;action?:string}|null;
 if(!body?.orderId||!['accept','complete'].includes(body.action||''))return respond({error:'Invalid trip action'},400);
 const {data:trip,error}=await db.from('delivery_tracking').select('order_id,accepted_at,finished_at,orders!inner(status)').eq('order_id',body.orderId).eq('rider_id',user.id).maybeSingle();
 if(error||!trip)return respond({error:'Delivery is not assigned to you'},403);
 const order=trip.orders as unknown as {status:string};
 if(trip.finished_at)return respond({error:'Trip already completed'},409);
 if(body.action==='accept'){
  if(order.status!=='out_for_delivery')return respond({error:'Order is not dispatched'},409);
  if(trip.accepted_at)return respond({ok:true,alreadyAccepted:true});
  const {data, error:updateError}=await db.from('delivery_tracking').update({accepted_at:new Date().toISOString()}).eq('order_id',body.orderId).eq('rider_id',user.id).is('accepted_at',null).select('order_id').maybeSingle();
  return updateError||!data?respond({error:'Could not accept trip'},409):respond({ok:true});
 }
 if(!trip.accepted_at)return respond({error:'Accept the trip first'},409);
 if(order.status!=='delivered')return respond({error:'Admin must confirm delivery before closing this trip'},409);
 const {data,error:updateError}=await db.from('delivery_tracking').update({finished_at:new Date().toISOString()}).eq('order_id',body.orderId).eq('rider_id',user.id).is('finished_at',null).select('order_id').maybeSingle();
 return updateError||!data?respond({error:'Could not complete trip'},409):respond({ok:true});
}
