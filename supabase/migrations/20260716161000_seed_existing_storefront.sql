-- Idempotent import of the storefront content that was previously hard-coded.
-- ON CONFLICT DO NOTHING protects any content already edited in Supabase.
insert into public.categories (name, slug, icon, image_url, color, sort_order, is_active) values
('Wine','wine','🍷','https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80','from-red-500 to-red-900',1,true),
('Gin','gin','🍸','https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=700&q=80','from-orange-300 to-orange-800',2,true),
('Whisky','whisky','🥃','https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=700&q=80','from-yellow-600 to-stone-900',3,true),
('Vodka','vodka','🍾','https://images.unsplash.com/photo-1605270012917-bf157c5a9541?auto=format&fit=crop&w=700&q=80','from-lime-300 to-stone-700',4,true),
('Beer','beer','🍺','https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80','from-green-400 to-green-900',5,true),
('Brandy','brandy','🍹','https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=700&q=80','from-amber-100 to-stone-700',6,true),
('Tequila','tequila','🌵','https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=700&q=80','from-amber-200 to-stone-700',7,true),
('Rum','rum','🥃','https://images.unsplash.com/photo-1582819509237-d5b75c4c3b0d?auto=format&fit=crop&w=700&q=80','from-yellow-200 to-stone-700',8,true),
('Liqueur','liqueur','🍶','https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=80','from-fuchsia-300 to-purple-800',9,true),
('Sparkling','sparkling','🍾','https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=700&q=80','from-yellow-300 to-stone-700',10,true),
('Mixers','mixers','🍸','https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80','from-teal-200 to-teal-800',11,true),
('Snacks','snacks','🍿','https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=700&q=80','from-yellow-100 to-orange-700',12,true)
on conflict (slug) do nothing;

insert into public.brands (name, slug, country, is_active) values
('Jameson','jameson','Ireland',true),
('Tanqueray','tanqueray','United Kingdom',true),
('Moët & Chandon','moet-chandon','France',true),
('Schweppes','schweppes','Kenya',true)
on conflict (slug) do nothing;

insert into public.products
(category_id, brand_id, name, slug, description, abv, country, bottle_size, price, old_price, stock, image_url, gallery_urls, is_featured, is_top_seller, is_new_arrival, is_active, sort_order)
values
((select id from public.categories where slug='whisky'),(select id from public.brands where slug='jameson'),'Jameson Irish Whiskey','jameson-irish-whiskey-750ml','Triple-distilled Irish whiskey with spice, vanilla and toasted wood.',40,'Ireland','750ml',2850,3200,240,'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=900&q=80',array['https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=80'],true,true,true,true,1),
((select id from public.categories where slug='gin'),(select id from public.brands where slug='tanqueray'),'Tanqueray London Dry Gin','tanqueray-london-dry-gin','Iconic dry gin for crisp G&Ts and premium cocktails.',43.1,'United Kingdom','750ml',3100,3500,180,'https://images.unsplash.com/photo-1605270012917-bf157c5a9541?auto=format&fit=crop&w=900&q=80',array['https://images.unsplash.com/photo-1605270012917-bf157c5a9541?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=80'],true,true,true,true,2),
((select id from public.categories where slug='sparkling'),(select id from public.brands where slug='moet-chandon'),'Moët & Chandon Brut','moet-chandon-brut','Elegant champagne for celebrations and corporate gifting.',12,'France','750ml',8900,9800,76,'https://images.unsplash.com/photo-1594980696639-2c9f72e3bc4b?auto=format&fit=crop&w=900&q=80',array['https://images.unsplash.com/photo-1594980696639-2c9f72e3bc4b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=900&q=80'],true,true,true,true,3),
((select id from public.categories where slug='mixers'),(select id from public.brands where slug='schweppes'),'Schweppes Tonic Water','schweppes-tonic-water','Classic mixer recommended with gin, whisky highballs and cocktail bundles.',0,'Kenya','500ml',120,null,900,'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',array['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80'],true,true,true,true,4)
on conflict (slug) do nothing;

insert into public.homepage_banners (title, subtitle, image_url, button_label, button_url, sort_order, is_active)
select seed.* from (values
('Buy more, chill faster','Orange-hot deals, 10–50 minute Nairobi delivery and WhatsApp ordering for parties, gifting and restocking.','https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1600&q=80','Buy now','/category/beer',1,true),
('Oaks-style browsing, ChupaHub speed','Large category tiles, instant search, live GPS delivery fees and secure M-Pesa checkout.','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80','Shop offers','/category/wine',2,true),
('Premium drinks delivered fast','Oaks-style shopping with ChupaHub speed, orange deals and live Nairobi delivery.','https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1600&q=80','Shop top sellers','/#top-sellers',3,true),
('Party stock in minutes','Whisky, gin, wines, beers, mixers and snacks delivered with M-Pesa checkout.','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80','Shop wine','/category/wine',4,true)
) as seed(title, subtitle, image_url, button_label, button_url, sort_order, is_active)
where not exists (select 1 from public.homepage_banners existing where existing.title = seed.title);

insert into public.promotions (title, code, description, discount_type, discount_value, badge_text, button_label, button_url, sort_order, is_active)
values ('Party Offers','PARTY','Special offers for parties, gifting and restocking.','percent',10,'Party deals','Shop offers','/category/beer',1,true)
on conflict (code) do nothing;

insert into public.delivery_settings (name, min_distance_km, max_distance_km, fee, estimated_minutes_min, estimated_minutes_max, sort_order, is_active) values
('0–5 km',0,5,150,10,30,1,true),
('5–10 km',5,10,250,20,40,2,true),
('10–12 km',10,12,350,30,50,3,true),
('Above 12 km',12,null,500,40,60,4,true)
on conflict (name) do nothing;
