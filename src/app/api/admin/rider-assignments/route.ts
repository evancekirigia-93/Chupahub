import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:NextRequest){
 const bearer=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 if(!bearer)return reply({error:'Administrator login required'},401);
 const db=getAdminSupabase();
 const {data:{user}}=await db.auth.getUser(bearer);
 if(!user)return reply({error:'Invalid session'},401);
 const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.id).eq('is_active',true).maybeSingle();
 if(!admin)return reply({error:'Administrator access required'},403);
 const body=await request.json().catch(()=>null) as {orderId?:string;riderId?:string}|null;
 if(!body?.orderId||!body?.riderId)return reply({error:'Order and rider required'},400);
 const {data:rider}=await db.from('delivery_riders').select('user_id,name,phone').eq('user_id',body.riderId).eq('active',true).maybeSingle();
 if(!rider)return reply({error:'Rider is not registered or inactive'},404);
 const {data:order}=await db.from('orders').select('id,status').eq('id',body.orderId).maybeSingle();
 if(!order||order.status!=='out_for_delivery')return reply({error:'Order must be dispatched first'},409);
 const {data:existing}=await db.from('delivery_tracking').select('order_id').eq('order_id',body.orderId).maybeSingle();
 if(existing)return reply({error:'Delivery already assigned; reassign through a reviewed admin flow'},409);
 const {error}=await db.from('delivery_tracking').insert({order_id:body.orderId,rider_id:rider.user_id});
 if(error)return reply({error:'Unable to assign rider'},500);
 return reply({ok:true,orderId:body.orderId,rider:{name:rider.name}});
}
