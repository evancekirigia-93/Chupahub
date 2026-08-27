import { NextRequest, NextResponse } from 'next/server';
import { kenyaPhone, requestStkPush } from '@/lib/server/mpesa';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';

type CartLine = { productId: string; variantId?: string; quantity: number };
type CheckoutBody = {
  cart: CartLine[];
  customer: { name: string; email?: string; phone: string; address: string; latitude: number; longitude: number; placeId?: string; placeName?: string; locationVerified?: boolean; deliveryInstructions?: string; apartment?: string; building?: string };
  paymentMethod: 'mpesa'|'cash'|'pickup';
  giftNote?: string;
};

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const distance=(a:number,b:number,c:number,d:number)=>{const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};
const problem=(message:string,status:number,requestId:string)=>NextResponse.json({error:message,requestId},{status,headers:{'Cache-Control':'no-store'}});
const safeMessage=(value:unknown)=>value instanceof Error?value.message:'Unable to place your order.';

export async function POST(request:NextRequest){
  const requestId=crypto.randomUUID();
  try{
    const body=await request.json() as CheckoutBody;
    const idempotencyKey=request.headers.get('idempotency-key')||'';
    if(!uuidPattern.test(idempotencyKey)) return problem('Please retry checkout. The order request identifier is invalid.',400,requestId);
    if(!Array.isArray(body.cart)||!body.cart.length) return problem('Your cart is empty.',400,requestId);
    if(!body.customer?.name?.trim()||!body.customer?.phone?.trim()) return problem('Name and phone number are required.',400,requestId);
    if(!['mpesa','cash','pickup'].includes(body.paymentMethod)) return problem('Unsupported payment method.',400,requestId);
    if(body.paymentMethod!=='pickup'&&!body.customer.address?.trim()) return problem('Delivery address is required.',400,requestId);
    if(body.paymentMethod!=='pickup'&&!body.customer.locationVerified&&body.customer.placeId) return problem('The delivery location could not be verified.',400,requestId);
    for(const line of body.cart){
      if(!uuidPattern.test(String(line.productId))||(line.variantId&&!uuidPattern.test(String(line.variantId)))||!Number.isInteger(Number(line.quantity))||Number(line.quantity)<1) return problem('Your cart contains an invalid product or quantity.',400,requestId);
    }

    const db=getAdminSupabase();
    const auth=await createServerSupabase();
    const {data:authData}=auth?await auth.auth.getUser():{data:{user:null}};
    const {data:checkout,error:settingsError}=await db.from('store_settings').select('value').eq('key','checkout').maybeSingle();
    const {data:bands,error:bandsError}=await db.from('delivery_settings').select('*').eq('is_active',true).order('sort_order');
    if(settingsError||bandsError) throw new Error('Checkout configuration is temporarily unavailable.');
    const store=(checkout?.value||{}) as Record<string,unknown>;
    const km=body.paymentMethod==='pickup'||!body.customer.locationVerified?null:distance(Number(store.store_latitude??-1.286389),Number(store.store_longitude??36.817223),body.customer.latitude,body.customer.longitude);
    const band=body.paymentMethod==='pickup'?null:km==null?(bands||[]).at(-1):(bands||[]).find(entry=>km>=Number(entry.min_distance_km)&&(entry.max_distance_km==null||km<=Number(entry.max_distance_km)))||(bands||[]).at(-1);
    if(body.paymentMethod!=='pickup'&&!band) return problem('This delivery location is outside the configured delivery area.',409,requestId);
    const deliveryFee=body.paymentMethod==='pickup'?0:Number(band?.fee||0);

    let customerId:string|null=null,deliveryLocationId:string|null=null;
    if(authData.user){
      const {data:customer,error:customerError}=await db.from('customers').upsert({user_id:authData.user.id,full_name:body.customer.name.trim(),email:body.customer.email?.trim()||authData.user.email||null,phone:body.customer.phone.trim()},{onConflict:'user_id'}).select('id').single();
      if(customerError) throw customerError;
      customerId=customer?.id||null;
      if(customerId&&body.paymentMethod!=='pickup'){
        const {data:existing}=await db.from('delivery_locations').select('id').eq('customer_id',customerId).eq('address',body.customer.address.trim()).maybeSingle();
        if(existing) deliveryLocationId=existing.id;
        else{
          const {data:location,error:locationError}=await db.from('delivery_locations').insert({customer_id:customerId,label:'Saved from checkout',address:body.customer.address.trim(),apartment:body.customer.apartment?.trim()||null,building:body.customer.building?.trim()||null,delivery_instructions:body.customer.deliveryInstructions?.trim()||null,latitude:body.customer.locationVerified?body.customer.latitude:null,longitude:body.customer.locationVerified?body.customer.longitude:null,place_id:body.customer.placeId||null,place_name:body.customer.placeName||null,is_default:false}).select('id').single();
          if(locationError) throw locationError;
          deliveryLocationId=location?.id||null;
        }
      }
    }

    const paymentStatus=body.paymentMethod==='mpesa'?'pending_payment':body.paymentMethod==='cash'?'cash_due':'pending';
    const {data:result,error:orderError}=await db.rpc('create_checkout_order',{
      p_idempotency_key:idempotencyKey,
      p_cart:body.cart,
      p_order:{
        customer_id:customerId,delivery_location_id:deliveryLocationId,customer_name:body.customer.name.trim(),
        customer_email:body.customer.email?.trim()||null,customer_phone:body.customer.phone.trim(),
        delivery_address:body.paymentMethod==='pickup'?'Store pickup':body.customer.address.trim(),
        gps_lat:body.customer.locationVerified?body.customer.latitude:null,gps_lng:body.customer.locationVerified?body.customer.longitude:null,
        delivery_place_id:body.customer.placeId||null,delivery_place_name:body.customer.placeName||null,
        delivery_location_verified:Boolean(body.customer.locationVerified),delivery_instructions:body.customer.deliveryInstructions?.trim()||null,
        gift_note:body.giftNote?.trim()||null,payment_method:body.paymentMethod,payment_status:paymentStatus,
        status:body.paymentMethod==='mpesa'?'pending_payment':'pending',delivery_fee:deliveryFee
      }
    });
    if(orderError) throw orderError;
    const order=result as {id:string;order_number:string;checkout_token:string;payment_status:string;total:number;duplicate?:boolean};

    if(body.paymentMethod==='mpesa'&&!order.duplicate){
      const phone=kenyaPhone(body.customer.phone);
      try{
        const stk=await requestStkPush({amount:Number(order.total),phone,accountReference:order.order_number,description:'Chupa Hub order'});
        await db.from('payments').insert({order_id:order.id,provider:'mpesa',status:'pending',amount:Number(order.total),phone_number:phone,merchant_request_id:stk.merchantRequestId,checkout_request_id:stk.checkoutRequestId});
        return NextResponse.json({orderNumber:order.order_number,checkoutToken:order.checkout_token,paymentStatus:'pending_payment',message:'Check your phone and enter your M-Pesa PIN to complete payment.',requestId});
      }catch(cause){
        console.error('[checkout:mpesa]',{requestId,orderId:order.id,error:safeMessage(cause)});
        await db.from('orders').update({payment_status:'failed'}).eq('id',order.id);
        return problem('Your order was saved, but M-Pesa could not start. Please contact Chupa Hub with order '+order.order_number+'.',502,requestId);
      }
    }
    return NextResponse.json({orderNumber:order.order_number,checkoutToken:order.checkout_token,paymentStatus:order.payment_status,duplicate:Boolean(order.duplicate),requestId});
  }catch(cause){
    const message=safeMessage(cause);
    console.error('[checkout]',{requestId,error:message});
    const conflict=/stock|available|bottle size|product/i.test(message);
    return problem(conflict?message:'Checkout is temporarily unavailable. Please retry once.',conflict?409:500,requestId);
  }
}
