const {PGlite}=require('@electric-sql/pglite'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');`);await db.exec(fs.readFileSync('supabase/migrations/20261023000000_friend_invitations.sql','utf8'));
 const user=async n=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-0000-0000-'+String(n).padStart(12,'0')]);await db.exec('set role authenticated')};
 const snap=(club,prefix)=>({careerId:prefix,season:3,round:7,club:{name:club,country:'ישראל',money:2345678,players:Array.from({length:11},(_,i)=>({id:i,networkIdentity:prefix+i}))}});
 const rpc=async(fn,...args)=>(await db.query(`select public.${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0].result;
 await user(1);const a=snap('מכבי תל אביב','host');const room=await rpc('mp_create_room',a);assert.ok(room.invitation);
 await assert.rejects(()=>db.query('select * from public.mp_members'),/permission denied/);
 await user(2);await assert.rejects(()=>rpc('mp_join_room',room.invitation,snap('מכבי תל אביב','guest')),/club_taken/);

 await assert.rejects(()=>rpc('mp_get_room',room.id),/not_a_member/);
 const b=snap('ברצלונה','guest');b.club.players[0].networkIdentity='host0';b.club.players[0].wage=12345;await rpc('mp_join_room',room.invitation,b);await rpc('mp_join_room',room.invitation,b);const joined=await rpc('mp_get_room',room.id);assert.equal(joined.members.length,2);assert.equal(joined.members.filter(m=>m.mine).length,1);
 await user(3);await assert.rejects(()=>rpc('mp_join_room',room.invitation,snap('ליברפול','third')),/room_full/);
 await db.exec('reset role');const data=(await db.query('select snapshot from public.mp_members order by owner_id')).rows;assert.deepEqual(data.map(x=>x.snapshot),[a,b]);await db.exec("update public.mp_rooms set expires_at=now()-interval '1 second'");await db.exec('set role anon');await assert.rejects(()=>rpc('mp_preview_invitation',room.invitation),/invitation_expired/);await assert.rejects(()=>rpc('mp_create_room',a),/permission denied/);
 console.log('database: SQL executed; grants, unique clubs, two-member capacity, idempotent join, independent overlapping player copies, snapshot preservation and expiry passed; errors []');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
