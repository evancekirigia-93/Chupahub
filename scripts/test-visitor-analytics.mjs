import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

// Exercise the actual migration in PostgreSQL with Supabase's auth contract.
test('visitor analytics: unique periods, presence, permissions and admin exclusion', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table public.admin_users(user_id uuid primary key, is_active boolean not null);
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20261019120000_visitor_analytics.sql', import.meta.url), 'utf8'));
    const visitor = '11111111-1111-4111-8111-111111111111';
    const admin = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const query = async sql => (await db.query(sql)).rows;
    const record = id => db.query('select public.record_website_visit($1)', [id]);
    await db.exec('set role anon');
    await record(visitor);
    await record(visitor);
    await assert.rejects(db.query('select * from public.website_visitors'), /permission denied/);
    await assert.rejects(db.query('select public.website_visitor_statistics()'), /permission denied/);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query('select public.website_visitor_statistics()'), /Administrator access required/);
    await db.exec('reset role');
    await db.query('insert into public.admin_users values ($1, true)', [admin]);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [admin]);
    await db.exec('set role authenticated');
    let stats = (await query('select public.website_visitor_statistics() as stats'))[0].stats;
    assert.deepEqual([stats.online, stats.today, stats.week, stats.month, stats.total], [1, 1, 1, 1, 1], 'refreshes must not inflate any unique count');
    assert.ok(stats.started_at);
    await db.exec('reset role');
    // The same visitor returned yesterday: one unique for week/month, not two visits.
    await db.query(`insert into public.website_visitor_days values ($1, (now() at time zone 'Africa/Nairobi')::date - 1)`, [visitor]);
    await db.exec("update public.website_visitors set last_seen = now() - interval '3 minutes'");
    await db.exec('set role authenticated');
    stats = (await query('select public.website_visitor_statistics() as stats'))[0].stats;
    assert.deepEqual([stats.online, stats.today, stats.week, stats.month, stats.total], [0, 1, 1, 1, 1]);
    await record(visitor);
    stats = (await query('select public.website_visitor_statistics() as stats'))[0].stats;
    assert.deepEqual([stats.online, stats.today, stats.week, stats.month, stats.total], [0, 0, 0, 0, 0], 'identifying an admin removes their previous anonymous browser visits');
    await db.exec('reset role');
    assert.equal((await query('select count(*)::int as count from public.website_visitor_days'))[0].count, 0, 'admin removal cascades only to analytics days');
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await record(visitor);
    // Period boundaries are evaluated in Nairobi, not the database server timezone.
    await db.exec("set timezone = 'America/Los_Angeles'");
    assert.equal((await query("select visit_date = (now() at time zone 'Africa/Nairobi')::date as correct from public.website_visitor_days"))[0].correct, true);
    await assert.rejects(record(null), /Visitor identity required/);
  } finally { await db.close(); }
});
