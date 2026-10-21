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
    .select('order_id,accepted_at,started_at,finished_at,last_seen_at,distance_km,rider_pay_kes,orders!inner(order_number,status,delivery_address,delivery_instructions)')
    .eq('rider_id',auth.rider.user_id).order('updated_at',{ascending:false});
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
  const {data:assignment}=await auth.db.from('delivery_tracking').select('order_id,accepted_at,last_seen_at,latitude,longitude,distance_km,orders!inner(status)')
    .eq('order_id',body.orderId).eq('rider_id',auth.rider.user_id).is('finished_at',null).maybeSingle();
  if(!assignment)return json({error:'No active assignment'},403);
  const order=assignment.orders as unknown as {status:string};
  if(!assignment.accepted_at)return json({error:'Accept this delivery before starting GPS'},409);\n  if(order.status!=='out_for_delivery')return json({error:'Delivery not active'},409);
  if(assignment.last_seen_at&&Date.now()-new Date(assignment.last_seen_at).getTime()<3000)return json({ok:true,throttled:true});
  const lat=Number(body.latitude),lng=Number(body.longitude);
  let distance=Number(assignment.distance_km||0);
  if(assignment.latitude!==null&&assignment.longitude!==null&&Number(body.accuracy)<=100){
   const rad=Math.PI/180,dLat=(lat-Number(assignment.latitude))*rad,dLng=(lng-Number(assignment.longitude))*rad;
   const a=Math.sin(dLat/2)**2+Math.cos(Number(assignment.latitude)*rad)*Math.cos(lat*rad)*Math.sin(dLng/2)**2;
   const segment=6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
   if(segment>=0.015&&segment<=0.5)distance+=segment;
  }
  const {error}=await auth.db.from('delivery_tracking').update({
    latitude:body.latitude,longitude:body.longitude,accuracy_m:body.accuracy,
    distance_km:distance,last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()
  }).eq('order_id',body.orderId).eq('rider_id',auth.rider.user_id).is('finished_at',null);
  if(error)return json({error:'Unable to save location'},500);\n  if(Number(body.accuracy)<=100)await auth.db.from('delivery_tracking_points').insert({order_id:body.orderId,rider_id:auth.rider.user_id,latitude:lat,longitude:lng,accuracy_m:body.accuracy});
  return json({ok:true});
}
