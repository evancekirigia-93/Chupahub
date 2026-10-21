'use client';
import { FormEvent,useEffect,useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
type Rider={user_id:string;name:string;phone:string;active:boolean};
export default function AdminRidersPage(){
 const [riders,setRiders]=useState<Rider[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function access(){const db=createBrowserSupabase();if(!db)return '';const {data}=await db.auth.getSession();return data.session?.access_token||'';}
 async function load(){
  const token=await access();if(!token){setError('Please sign in to the Chupahub admin first.');return;}
  const res=await fetch('/api/admin/riders',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  const data=await res.json();if(!res.ok)setError(data.error||'Unable to load riders');else{setRiders(data.riders);setError('');}
 }
 useEffect(()=>{void load();},[]);
 async function create(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  const form=e.currentTarget;const values=new FormData(form);const token=await access();
  try{
   const res=await fetch('/api/admin/riders',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(values))});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not add rider');
   form.reset();setNotice('Rider login created. Share the email and temporary password securely, and ask the rider to change it.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Unexpected error');}finally{setBusy(false);}
 }
 return <main className="mx-auto max-w-4xl p-4 sm:p-8">
  <Link href="/admin" className="text-orange-600">← Admin dashboard</Link>
  <h1 className="mt-3 text-3xl font-black">Rider accounts</h1>
  <p className="mt-2 text-neutral-600">Create individual rider logins. Each rider signs in at /rider using their email and password.</p>
  {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
  {notice&&<p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-green-700">{notice}</p>}
  <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2">
   <label className="font-bold">Rider name<input name="name" required minLength={2} autoComplete="off" className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
   <label className="font-bold">Phone number<input name="phone" required minLength={7} type="tel" className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
   <label className="font-bold">Login email<input name="email" required type="email" autoComplete="off" className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
   <label className="font-bold">Temporary password<input name="password" required type="password" minLength={12} autoComplete="new-password" className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
   <button disabled={busy} className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">{busy?'Creating rider…':'Add rider'}</button>
  </form>
  <div className="mt-6 rounded-2xl bg-white p-5 shadow-card"><h2 className="text-xl font-black">Registered riders</h2>
   {riders.map(r=><div key={r.user_id} className="border-b py-3"><b>{r.name}</b> · {r.phone} · {r.active?'Active':'Inactive'}</div>)}
   {!riders.length&&<p className="mt-3 text-neutral-500">No riders registered.</p>}
  </div>
 </main>;
}
