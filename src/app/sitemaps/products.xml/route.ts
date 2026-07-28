import { absoluteUrl } from '@/lib/seo';import { getProducts } from '@/lib/supabase';import { sitemapResponse,xmlSitemap } from '@/lib/sitemap-xml';
export async function GET(){const products=await getProducts(),lastmod=new Date().toISOString();return sitemapResponse(xmlSitemap(products.map(product=>({loc:absoluteUrl(`/product/${product.slug}`),lastmod,changefreq:'daily',priority:.9}))))}
