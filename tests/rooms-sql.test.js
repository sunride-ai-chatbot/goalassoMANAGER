// The server side of network play (supabase/migrations) on a real Postgres in the process (PGlite): the two room
// migrations are applied to an empty database dressed like a Supabase project, then the SQL regressions of tests/sql run.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert');
const root=path.join(__dirname,'..'),sql=f=>fs.readFileSync(path.join(root,f),'utf8');
let PGlite;try{({PGlite}=require('@electric-sql/pglite'))}catch(e){console.log('rooms sql: @electric-sql/pglite is not installed, skipped; errors []');process.exit(0)}
(async()=>{
 const db=new PGlite();
 // what a Supabase project has before any migration: the roles, auth.users, auth.uid(), and its generous default privileges
 await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin;
  create schema auth;create table auth.users(id uuid primary key,aud text,role text);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
  grant usage on schema public to anon,authenticated,service_role;
  alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`);
 await db.exec(sql('supabase/migrations/20261024000000_rooms.sql'));
 await db.exec(sql('supabase/migrations/20261024055611_room_friendlies.sql'));
 const out=[];
 for(const f of ['tests/sql/rooms-base.sql','tests/sql/room-friendlies.sql']){const r=await db.exec(sql(f));const row=r.map(x=>x.rows&&x.rows[0]&&x.rows[0].result).find(Boolean);assert.match(row||'',/^passed:/,f);out.push(row)}
 assert.equal((await db.query('select count(*)::int n from public.mp_rooms')).rows[0].n,0,'the regressions leave nothing behind');
 // the one-file installer is exactly the two migrations, in order
 assert.equal(sql('supabase/install-rooms.sql').replace(/^--.*\n/gm,'').trim(),(sql('supabase/migrations/20261024000000_rooms.sql')+'\n'+sql('supabase/migrations/20261024055611_room_friendlies.sql')).replace(/^--.*\n/gm,'').trim());
 await db.close();
 console.log('rooms sql: '+out.join(' | ')+'; errors []');
})().catch(e=>{console.error(e);console.log('errors',[String(e&&e.message||e)]);process.exit(1)});
