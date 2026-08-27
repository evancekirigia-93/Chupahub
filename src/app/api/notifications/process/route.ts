import { NextRequest } from 'next/server';
import { processPendingNotifications } from '@/lib/server/notification-worker';

export const dynamic='force-dynamic';
export const maxDuration=60;

async function processOutbox(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`) return Response.json({error:'Unauthorized'},{status:401});
  try{return Response.json(await processPendingNotifications());}
  catch(cause){return Response.json({error:cause instanceof Error?cause.message:'Notification processing failed.'},{status:500});}
}
export const GET=processOutbox;
export const POST=processOutbox;
