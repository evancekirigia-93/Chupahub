import { readdirSync } from 'node:fs';

const files=readdirSync('supabase/migrations').filter(name=>name.endsWith('.sql')).sort();
const timestamps=files.map(name=>name.split('_',1)[0]);
const duplicates=timestamps.filter((value,index)=>timestamps.indexOf(value)!==index);
if(duplicates.length){
  console.error('Duplicate migration timestamps:',[...new Set(duplicates)].join(', '));
  process.exit(1);
}
const reliability='20260827110000_transactional_checkout_dispatch.sql';
if(!files.includes(reliability)){
  console.error('Missing commerce reliability migration:',reliability);
  process.exit(1);
}
console.log(`Checked ${files.length} ordered Supabase migrations.`);
