import { NextRequest } from 'next/server';
import { getAdminSupabase } from '@/lib/server/supabase-admin';
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function adminDb(request:NextRequest){
 const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 if(!token)return null;
 const db=getAdminSupabase();
 const {data:{user}}=await db.auth.getUser(token);
 if(!user)return null;
 const {data:admin}=await db.from('admin_users').select('user_id').eq('user_id',user.id).eq('is_active',true).maybeSingle();
 return admin?db:null;
}
export async function GET(request:NextRequest){
 const db=await adminDb(request);if(!db)return respond({error:'Admin access required'},403);
 const {data,error}=await db.from('delivery_riders').select('user_id,name,phone,active,created_at').order('created_at',{ascending:false});
 return error?respond({error:'Could not load riders'},500):respond({riders:data});
}
export async function POST(request:NextRequest){
 const db=await adminDb(request);if(!db)return respond({error:'Admin access required'},403);
 const body=await request.json().catch(()=>null) as {name?:string;email?:string;phone?:string;password?:string}|null;
 const name=body?.name?.trim()||'',email=body?.email?.trim().toLowerCase()||'',phone=body?.phone?.trim()||'',password=body?.password||'';
 if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||phone.length<7||phone.length>30||password.length<12||password.length>128)
  return respond({error:'Provide a name, valid email, phone and password of at least 12 characters.'},400);
 const {data:created,error:createError}=await db.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{chupahub_role:'rider'}});
 if(createError||!created.user)return respond({error:createError?.message||'Could not create rider login'},400);
 const {error}=await db.from('delivery_riders').insert({user_id:created.user.id,name,phone,active:true});
 if(error){
  await db.auth.admin.deleteUser(created.user.id);
  return respond({error:'Could not save rider profile; login was rolled back.'},500);
 }
 return respond({ok:true,rider:{user_id:created.user.id,name,phone,email}},201);
}
