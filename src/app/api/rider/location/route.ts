import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function riderAuth(request:NextRequest){
  const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return null;
  const db=getAdminSupabase();
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)return null;
  const {data:rider}=await db.from('delivery_riders').select('user_id,name,active').eq('user_id',user.id).eq('active',true).maybeSingle();
  return rider?{db,rider}:null;
}
export async function GET(request:NextRequest){
  const auth=await riderAuth(request);
  if(!auth)return json({error:'Rider login required'},403);
  const {data,error}=await auth.db.from('delivery_tracking')
    .select('order_id,started_at,finished_at,last_seen_at,orders!inner(order_number,status,delivery_address,delivery_instructions)')
    .eq('rider_id',auth.rider.user_id).is('finished_at',null);
  if(error)return json({error:'Unable to load deliveries'},500);
  return json({deliveries:data||[]});
}
export async function POST(request:NextRequest){
  const auth=await riderAuth(request);
  if(!auth)return json({error:'Rider login required'},403);
  const body=await request.json().catch(()=>null) as {orderId?:string;latitude?:number;longitude?:number;accuracy?:number}|null;
  if(!body||typeof body.orderId!=='string'||!Number.isFinite(body.latitude)||!Number.isFinite(body.longitude)||
    Number(body.latitude)<-90||Number(body.latitude)>90||Number(body.longitude)<-180||Number(body.longitude)>180||
    !Number.isFinite(body.accuracy)||Number(body.accuracy)<0||Number(body.accuracy)>10000)return json({error:'Invalid location'},400);
  const {data:assignment}=await auth.db.from('delivery_tracking').select('order_id,last_seen_at,orders!inner(status)')
    .eq('order_id',body.orderId).eq('rider_id',auth.rider.user_id).is('finished_at',null).maybeSingle();
  if(!assignment)return json({error:'No active assignment'},403);
  const order=assignment.orders as unknown as {status:string};
  if(order.status!=='out_for_delivery')return json({error:'Delivery not active'},409);
  if(assignment.last_seen_at&&Date.now()-new Date(assignment.last_seen_at).getTime()<3000)return json({ok:true,throttled:true});
  const {error}=await auth.db.from('delivery_tracking').update({
    latitude:body.latitude,longitude:body.longitude,accuracy_m:body.accuracy,
    started_at:new Date().toISOString(),last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()
  }).eq('order_id',body.orderId).eq('rider_id',auth.rider.user_id).is('finished_at',null);
  if(error)return json({error:'Unable to save location'},500);
  return json({ok:true});
}
