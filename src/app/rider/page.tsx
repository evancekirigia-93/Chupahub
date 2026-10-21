'use client';
import { FormEvent,useEffect,useRef,useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase-browser';

type Delivery={order_id:string;started_at:string|null;last_seen_at:string|null;orders:{order_number:string;status:string;delivery_address:string;delivery_instructions:string|null}};
export default function RiderPage(){
 const [signedIn,setSignedIn]=useState(false);const [deliveries,setDeliveries]=useState<Delivery[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [active,setActive]=useState<string|null>(null);
 const watch=useRef<number|null>(null);
 const sending=useRef(false);
 const activeRef=useRef<string|null>(null);
 const stop=()=>{if(watch.current!==null&&typeof navigator!=='undefined'){navigator.geolocation.clearWatch(watch.current);watch.current=null;}activeRef.current=null;setActive(null);};
 useEffect(()=>()=>{if(watch.current!==null)navigator.geolocation.clearWatch(watch.current);},[]);
 async function token(){const db=createBrowserSupabase();const {data}=await db!.auth.getSession();return data.session?.access_token;}
 async function load(){
  const access=await token();if(!access){setError('Sign in to Chupahub with your rider account first.');return;}
  const response=await fetch('/api/rider/location',{headers:{Authorization:`Bearer ${access}`},cache:'no-store'});
  const result=await response.json();if(!response.ok){setError(result.error||'Unable to load deliveries');return;}
  setDeliveries(result.deliveries);setSignedIn(true);setError('');
 }
 useEffect(()=>{void load();},[]);
 async function login(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');
  const fd=new FormData(e.currentTarget);const db=createBrowserSupabase();
  if(!db){setError('Authentication is unavailable');return;}
  const {error}=await db.auth.signInWithPassword({email:String(fd.get('email')),password:String(fd.get('password'))});
  if(error){setError(error.message);return;}await load();
 }
 async function send(orderId:string,position:GeolocationPosition){
  if(sending.current)return;sending.current=true;
  try{
   const access=await token();if(!access){stop();setError('Session expired');return;}
   const response=await fetch('/api/rider/location',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${access}`},body:JSON.stringify({orderId,latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy})});
   if(!response.ok){const data=await response.json();setError(data.error||'GPS update failed');if(response.status===403||response.status===409)stop();}
   else setNotice(`Location updated at ${new Date().toLocaleTimeString()}`);
  }catch{setError('Network unavailable; location will retry when GPS reports again.');}
  finally{sending.current=false;}
 }
 async function accept(id:string){
  setError('');setNotice('');
  try{
   const access=await token();if(!access){setError('Sign in again to accept this delivery.');return;}
   const response=await fetch('/api/rider/location',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${access}`},body:JSON.stringify({orderId:id})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to accept order');
   setDeliveries(current=>current.map(d=>d.order_id===id?{...d,started_at:d.started_at||new Date().toISOString()}:d));
   setNotice('Order accepted. GPS tracking is starting.');
   start(id);
  }catch(e){setError(e instanceof Error?e.message:'Unable to accept order');}
 }
 function start(id:string){
  if(!navigator.geolocation){setError('This device does not support GPS');return;}
  stop();setError('');activeRef.current=id;setActive(id);
  watch.current=navigator.geolocation.watchPosition(p=>{if(activeRef.current===id)void send(id,p);},
   e=>setError(`GPS unavailable: ${e.message}`),{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  setNotice('Order accepted. Location tracking is active while this page remains open.');
 }
 return <main className="mx-auto max-w-2xl p-4 sm:p-8"><h1 className="text-3xl font-black">Chupahub Rider</h1>
  <p className="mt-2 text-neutral-600">Your assigned deliveries. Browser GPS is foreground-only; background tracking requires the Android rider app.</p>
  {error&&<p role="alert" className="mt-4 rounded-xl bg-red-100 p-3 text-red-800">{error}</p>}
  {notice&&<p role="status" className="mt-4 rounded-xl bg-green-100 p-3 text-green-800">{notice}</p>}
  {!signedIn&&<form onSubmit={login} className="mt-4 grid gap-3 rounded-xl bg-white p-4">
   <label>Email<input name="email" type="email" required autoComplete="username" className="mt-1 block w-full rounded-lg border p-3"/></label>
   <label>Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 block w-full rounded-lg border p-3"/></label>
   <button className="rounded-xl bg-orange-600 p-3 font-bold text-white">Sign in as rider</button>
  </form>}
  <button onClick={()=>void load()} className="mt-4 rounded-xl border px-4 py-2">Refresh deliveries</button>
  <div className="mt-4 space-y-4">{deliveries.map(d=><section key={d.order_id} className="rounded-2xl border bg-white p-5">
   <h2 className="text-xl font-bold">#{d.orders.order_number}</h2><p>{d.orders.delivery_address}</p>
   {d.orders.delivery_instructions&&<p className="text-sm text-neutral-500">{d.orders.delivery_instructions}</p>}
   <p className="mt-2 text-sm">Last GPS update: {d.last_seen_at?new Date(d.last_seen_at).toLocaleString():'Not started'}</p>
   {!d.started_at?<button onClick={()=>void accept(d.order_id)} className="mt-3 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white">Accept order</button>:
   <div className="mt-3"><p className="font-semibold text-green-700">Order accepted</p>{active===d.order_id?<button onClick={stop} className="mt-2 rounded-xl border px-5 py-3 font-bold">Pause location tracking</button>:<button onClick={()=>start(d.order_id)} className="mt-2 rounded-xl bg-orange-600 px-5 py-3 font-bold text-white">Resume location tracking</button>}</div>}
  </section>)}</div>
  {!deliveries.length&&!error&&<p className="mt-5">No deliveries assigned yet.</p>}
 </main>;
}
