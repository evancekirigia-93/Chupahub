import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';

export async function GET(request:NextRequest){
 const orderNumber=(request.nextUrl.searchParams.get('number')||'').trim();
 if(orderNumber.length<5||orderNumber.length>50||!/^[a-zA-Z0-9-]+$/.test(orderNumber))
  return Response.json({error:'Enter a valid order number.'},{status:400});
 const db=getAdminSupabase();
 const {data,error}=await db.from('orders').select('id,status').eq('order_number',orderNumber).maybeSingle();
 if(error)return Response.json({error:'Tracking is temporarily unavailable.'},{status:503});
 if(!data)return Response.json({error:'Order not found. Check the number and try again.'},{status:404});
 const status=['out_for_delivery','dispatched'].includes(data.status)?'Dispatched':
 ['delivered','completed'].includes(data.status)?'Delivered':
 data.status==='cancelled'?'Cancelled':data.status==='rejected'?'Rejected':
 ['processing','packing'].includes(data.status)?'Processing':
 ['confirmed','accepted'].includes(data.status)?'Confirmed':'Received';
 let riderLocation:null|{latitude:number;longitude:number;updatedAt:string;approximate:true}=null;
 if(data.status==='out_for_delivery'){
  const {data:tracking,error:trackingError}=await db.from('delivery_tracking')
   .select('latitude,longitude,last_seen_at,started_at,finished_at')
   .eq('order_id',data.id).maybeSingle();
  if(trackingError)console.error('[customer tracking location]',trackingError.message);
  if(tracking?.started_at&&!tracking.finished_at&&tracking.last_seen_at&&
    typeof tracking.latitude==='number'&&typeof tracking.longitude==='number'&&
    Date.now()-new Date(tracking.last_seen_at).getTime()<10*60*1000){
    riderLocation={latitude:Number(tracking.latitude.toFixed(3)),
     longitude:Number(tracking.longitude.toFixed(3)),updatedAt:tracking.last_seen_at,approximate:true};
  }
 }
 return Response.json({status,riderLocation},{headers:{'Cache-Control':'no-store'}});
}
