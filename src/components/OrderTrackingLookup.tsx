'use client';
import { FormEvent,useState } from 'react';
export default function OrderTrackingLookup(){
 const [number,setNumber]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function lookup(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');setStatus('');
  try{const response=await fetch('/api/track-order?number='+encodeURIComponent(number.trim()),{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'Tracking unavailable');setStatus(data.status);}
  catch(cause){setError(cause instanceof Error?cause.message:'Unable to track order');}
  finally{setBusy(false);}
 }
 return <div className="mt-6"><form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row"><label className="flex-1 font-bold">Order number<input value={number} onChange={event=>setNumber(event.target.value)} placeholder="Enter your confirmation order number" required minLength={5} maxLength={50} className="mt-2 w-full rounded-xl border p-3 font-normal"/></label><button disabled={busy} className="orange-gradient self-end rounded-xl px-6 py-3 font-black text-white disabled:opacity-50">{busy?'Checking…':'Track order'}</button></form>{status&&<div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5"><p className="text-sm font-bold">Current order status</p><p className="mt-1 text-2xl font-black">{status}</p></div>}{error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}<p className="mt-3 text-sm text-neutral-600">For your privacy, only the order status is displayed. Contact customer care for further assistance.</p></div>;
}
