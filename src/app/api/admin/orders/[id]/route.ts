import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';

async function administrator(request:NextRequest){
  const token=request.headers.get('authorization')?.replace(/^Bearer\s+/,'');
  if(!token)return null;
  const db=getAdminSupabase();
  const {data:user}=await db.auth.getUser(token);
  if(!user.user)return null;
  const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.user.id).eq('is_active',true).maybeSingle();
  return admin?{db,userId:user.user.id,token}:null;
}
const responseError=(message:string,status:number)=>Response.json({error:message},{status});

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const admin=await administrator(request);
  if(!admin)return responseError('Administrator access required.',403);
  const {id}=await params;
  const body=await request.json() as {paymentStatus?:'paid'|'unpaid';status?:string;note?:string;riderName?:string;riderPhone?:string;checkedItemIds?:string[]};
  const {data:order,error:findError}=await admin.db.from('orders').select('id,status,payment_status,payment_method,order_number').eq('id',id).maybeSingle();
  if(findError)return responseError(findError.message,500);
  if(!order)return responseError('Order not found.',404);

  if(body.paymentStatus&&!body.status){
    const paymentStatus=body.paymentStatus==='paid'?'paid':order.payment_method==='mpesa'?'pending_payment':order.payment_method==='cash'?'cash_due':'pending';
    const {data:updated,error}=await admin.db.from('orders').update({payment_status:paymentStatus,updated_at:new Date().toISOString()}).eq('id',id).select('id,status,payment_status,updated_at').single();
    if(error)return responseError(error.message,400);
    await admin.db.from('audit_log').insert({table_name:'orders',record_id:id,action:'PAYMENT_STATUS',old_data:{payment_status:order.payment_status},new_data:{payment_status:paymentStatus},user_id:admin.userId});
    return Response.json({ok:true,order:updated,paymentLabel:body.paymentStatus==='paid'?'Paid':'Unpaid'});
  }

  if(body.status!=='out_for_delivery')return responseError('Orders can only be marked paid, unpaid, or dispatched from this endpoint.',400);
  if(!Array.isArray(body.checkedItemIds)||!body.checkedItemIds.length)return responseError('Tick every product before dispatching.',400);

  // Use the admin JWT so auth.uid() and the database admin check remain effective.
  const {createClient}=await import('@supabase/supabase-js');
  const userDb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    global:{headers:{Authorization:`Bearer ${admin.token}`}},auth:{persistSession:false,autoRefreshToken:false}
  });
  const {data:updated,error}=await userDb.rpc('dispatch_order',{
    p_order_id:id,p_rider_name:body.riderName?.trim()||'',p_rider_phone:body.riderPhone?.trim()||'',
    p_checked_item_ids:body.checkedItemIds,p_note:body.note||'All dispatch items physically checked by admin.'
  });
  if(error)return responseError(error.message,400);
  return Response.json({ok:true,order:updated});
}
