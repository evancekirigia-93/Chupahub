import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
export async function GET(request:NextRequest){
 const orderNumber=(request.nextUrl.searchParams.get('number')||'').trim();
 if(orderNumber.length<5||orderNumber.length>50||!/^[a-zA-Z0-9-]+$/.test(orderNumber))return Response.json({error:'Enter a valid order number.'},{status:400});
 const db=getAdminSupabase();
 const {data,error}=await db.from('orders').select('status').eq('order_number',orderNumber).maybeSingle();
 if(error)return Response.json({error:'Tracking is temporarily unavailable.'},{status:503});
 if(!data)return Response.json({error:'Order not found. Check the number and try again.'},{status:404});
 const status=data.status==='out_for_delivery'||data.status==='dispatched'?'Dispatched':data.status==='delivered'?'Delivered':data.status==='cancelled'?'Cancelled':data.status==='rejected'?'Rejected':data.status==='processing'||data.status==='packing'?'Processing':data.status==='confirmed'||data.status==='accepted'?'Confirmed':'Received';
 return Response.json({status},{headers:{'Cache-Control':'no-store'}});
}
