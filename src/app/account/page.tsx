import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountDashboard } from '@/components/account/AccountDashboard';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
const title = 'Your Chupa Hub Customer Dashboard';
const description = 'Manage Chupa Hub orders, rewards, saved addresses, favourites and customer account details.';
export const metadata: Metadata = { title, description, alternates: { canonical: '/account' }, openGraph: { title: `${title} | Chupa Hub`, description, url: '/account', type: 'website' }, twitter: { card: 'summary', title: `${title} | Chupa Hub`, description }, robots: { index: false, follow: false } };

export default async function AccountPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login?error=Customer%20login%20is%20not%20configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const metadata = user.user_metadata || {};
  const googleName = String(metadata.full_name || metadata.name || 'Customer');
  const googlePhone = String(metadata.phone || metadata.phone_number || '');
  const { data: existingCustomer } = await supabase.from('customers').select('id,full_name,email,phone,created_at').eq('user_id', user.id).maybeSingle();

  let customer = existingCustomer;
  let customerError: { message?: string } | null = null;

  if (!customer) {
    const result = await supabase.from('customers').insert({
      user_id: user.id,
      full_name: googleName,
      email: user.email || null,
      phone: googlePhone || null,
    }).select('id,full_name,email,phone,created_at').single();
    customer = result.data;
    customerError = result.error;
  } else {
    const updates: Record<string, string> = {};
    if (!customer.full_name && googleName) updates.full_name = googleName;
    if (!customer.email && user.email) updates.email = user.email;
    if (!customer.phone && googlePhone) updates.phone = googlePhone;
    if (Object.keys(updates).length) {
      const result = await supabase.from('customers').update(updates).eq('id', customer.id).select('id,full_name,email,phone,created_at').single();
      customer = result.data || customer;
      customerError = result.error;
    }
  }

  if (customerError || !customer) return <main className="mx-auto max-w-2xl p-8"><div className="rounded-3xl bg-white p-7 shadow-card"><h1 className="text-3xl font-black">Account setup required</h1><p className="mt-3 text-neutral-600">{customerError?.message || 'Your customer profile could not be created.'} Apply the latest customer rewards migration, then refresh this page.</p></div></main>;

  const name = customer.full_name || googleName;
  const phone = customer.phone || googlePhone;
  const [ordersResult,addressesResult,rewardResult]=await Promise.all([
    supabase.from('orders').select('id,order_number,created_at,total,discount_total,delivery_fee,payment_status,status,rider_name,delivered_at,tracking_url,order_items(id,product_id,variant_id,product_name,quantity,unit_price,line_total,products(name,categories(name)))').eq('customer_id',customer.id).order('created_at',{ascending:false}),
    supabase.from('delivery_locations').select('id,label,address,apartment,building,delivery_instructions,is_default').eq('customer_id',customer.id).order('is_default',{ascending:false}),
    supabase.from('reward_accounts').select('id,points_balance,lifetime_points,points_redeemed').eq('customer_id',customer.id).maybeSingle(),
  ]);
  const reward=rewardResult.data||{points_balance:0,lifetime_points:0,points_redeemed:0};
  const { data: activity }=rewardResult.data?.id?await supabase.from('reward_transactions').select('id,points,description,transaction_type,created_at').eq('reward_account_id',rewardResult.data.id).order('created_at',{ascending:false}).limit(20):{data:[]};
  return <AccountDashboard data={{customerId:customer.id,name,email:customer.email||user.email||'',phone,avatar:String(metadata.avatar_url||metadata.picture||''),memberSince:user.created_at||customer.created_at,orders:(ordersResult.data||[]) as never[],addresses:(addressesResult.data||[]) as never[],rewards:reward,activity:(activity||[]) as never[]}}/>;
}
