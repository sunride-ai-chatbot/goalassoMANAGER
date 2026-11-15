-- Transactional regression for the season of a shared league (20261115120000_shared_league_season.sql).
-- Three managers, so every round has a match and a free evening. Nothing persists.
begin;
do $$
declare
 h uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); x uuid:=gen_random_uuid();
 lg jsonb; v jsonb; inv uuid; lid uuid; fid uuid; f record; i int; k text; seed0 bigint; mh bigint; ma bigint; home_ uuid; away_ uuid; bye_ uuid; r int; n int;
begin
 insert into auth.users(id,aud,role) values(h,'authenticated','authenticated'),(g,'authenticated','authenticated'),(x,'authenticated','authenticated');
 foreach k in array array['GK','DF','MF','FW'] loop
  for i in 1..40 loop insert into public.lg_pool(player,name,pos,age,value) values(k||'-'||i,k||' '||i,k,20+i%12,(200000+i*190000)::bigint); end loop;
 end loop;
 insert into public.lg_pool(player,name,pos,age,value) values('star','Star','FW',27,20000000);

 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',h::text,true);
 lg:=public.lg_create('Evenings','Reds',3);lid:=(lg->>'id')::uuid;inv:=(lg->>'invitation')::uuid;
 begin perform public.lg_start(lid);raise exception 'expected not_enough_managers';
 exception when raise_exception then if sqlerrm<>'not_enough_managers' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',g::text,true);perform public.lg_join(inv,'Blues');
 perform set_config('request.jwt.claim.sub',x::text,true);perform public.lg_join(inv,'Greens');
 begin perform public.lg_start(lid);raise exception 'expected host_only';
 exception when raise_exception then if sqlerrm<>'host_only' then raise; end if;end;
 begin perform public.lg_train(lid,'GK-1');raise exception 'expected no_season';
 exception when raise_exception then if sqlerrm<>'no_season' then raise; end if;end;

 -- "build me a squad": sixteen players, every line covered, paid for out of the one budget
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.lg_buy(lid,'star');
 v:=public.lg_autofill(lid);
 assert (v->>'squad')::int=16 and (v->>'money')::bigint>=0,'sixteen players inside the budget: '||v::text;
 execute 'reset role';
 assert (select count(*) from public.lg_squads s join public.lg_pool p on p.player=s.player where s.league_id=lid and s.owner_id=h and p.pos='GK')>=2,'two keepers';
 assert (select count(*) from public.lg_squads s join public.lg_pool p on p.player=s.player where s.league_id=lid and s.owner_id=h and p.pos='DF')>=5;
 assert (select count(*) from public.lg_squads s join public.lg_pool p on p.player=s.player where s.league_id=lid and s.owner_id=h and p.pos='FW')>=3;
 assert (select money from public.lg_members where league_id=lid and owner_id=h)=(select sum(amount) from public.lg_ledger where league_id=lid and owner_id=h);
 execute 'set local role authenticated';
 v:=public.lg_prices(array['star','GK-1','nobody']);
 assert (v->>'star')::bigint=20000000 and (v->>'GK-1')::bigint=390000 and v->>'nobody' is null,'prices come from the pool';
 v:=public.lg_setup(lid,'{"formation":"4-4-2","lineup":["star"],"mentality":"att"}'::jsonb);
 begin perform public.lg_setup(lid,to_jsonb(repeat('x',4000)));raise exception 'expected invalid_setup';
 exception when raise_exception then if sqlerrm<>'invalid_setup' then raise; end if;end;

 -- a manager who has spent everything still fields a team: the start fills what he cannot pay for, for nothing
 execute 'reset role';
 insert into public.lg_ledger(league_id,owner_id,amount,reason,note) select lid,x,100000-money,'buy','spent on stars' from public.lg_members where league_id=lid and owner_id=x;
 update public.lg_members set money=100000 where league_id=lid and owner_id=x;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',x::text,true);
 begin perform public.lg_autofill(lid);raise exception 'expected no_money';
 exception when raise_exception then if sqlerrm<>'no_money' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 -- the start: whoever had not finished shopping is given a legal squad, and everyone meets everyone twice
 v:=public.lg_start(lid);
 assert (v->>'fixtures')::int=6,'three managers, home and away: '||v::text;
 begin perform public.lg_start(lid);raise exception 'expected league_started';
 exception when raise_exception then if sqlerrm<>'league_started' then raise; end if;end;
 v:=public.lg_get(lid);
 assert v->>'phase'='season' and (v->>'round')::int=1 and jsonb_array_length(v->'fixtures')=6 and v->>'me'=h::text;
 assert (select bool_and((m->>'squad')::int>=14) from jsonb_array_elements(v->'members') m),'nobody starts a season without a team';
 assert jsonb_array_length(v->'table')=3 and (v->'setup'->>'formation')='4-4-2';
 assert (select (m->>'money')::bigint from jsonb_array_elements(v->'members') m where m->>'id'=x::text)>=0,'and it cost him nothing he did not have';
 assert jsonb_array_length(v->'squads')=(select sum((m->>'squad')::int) from jsonb_array_elements(v->'members') m);

 -- training: three a round, on your own players
 v:=public.lg_train(lid,'star');v:=public.lg_train(lid,'star');v:=public.lg_train(lid,'star');
 assert (v->>'used')::int=3 and (v->>'total')::int=3;
 begin perform public.lg_train(lid,'star');raise exception 'expected no_sessions_left';
 exception when raise_exception then if sqlerrm<>'no_sessions_left' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_train(lid,'star');raise exception 'expected not_yours';
 exception when raise_exception then if sqlerrm<>'not_yours' then raise; end if;end;
 v:=public.lg_ground(lid);assert (v->>'ground')::int=1 and (v->>'charged')::bigint=1000000;
 v:=public.lg_ground(lid);assert (v->>'ground')::int=2 and (v->>'charged')::bigint=2000000;

 -- the first evening: one match, one manager free
 execute 'reset role';
 select * into f from public.lg_fixtures where league_id=lid and season=1 and round=1;
 fid:=f.id;home_:=f.home_id;away_:=f.away_id;seed0:=f.seed;
 select owner_id into bye_ from public.lg_members where league_id=lid and owner_id not in (home_,away_);
 mh:=(select money from public.lg_members where league_id=lid and owner_id=home_);ma:=(select money from public.lg_members where league_id=lid and owner_id=away_);
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',bye_::text,true);
 begin perform public.lg_fixture_lock(fid,'v1');raise exception 'expected not_your_match';
 exception when raise_exception then if sqlerrm<>'not_your_match' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',home_::text,true);
 begin perform public.lg_pen(fid,0,'h','UL');raise exception 'expected not_in_play';
 exception when raise_exception then if sqlerrm<>'not_in_play' then raise; end if;end;
 v:=public.lg_fixture_state(fid);
 assert v->>'seed' is null and v->'lock'='null'::jsonb,'the seed is not shown before the match is locked: '||v::text;
 v:=public.lg_fixture_lock(fid,'v1');
 assert v->'lock'->>'by'=home_::text,'the lock remembers who opened the match';
 assert v->>'mine'='h' and (v->>'seed')::bigint=seed0 and v->'lock'->>'sim'='v1','the lock: '||(v-'lock')::text;
 assert jsonb_array_length(v->'lock'->'home'->'squad')>=14 and jsonb_array_length(v->'lock'->'away'->'squad')>=14;
 assert not (v->>'here')::boolean,'the other manager has not been to this match';
 if home_=h then assert (select (e->>'t')::int from jsonb_array_elements(v->'lock'->'home'->'squad') e where e->>'p'='star')=3,'training is locked in with the squad'; end if;
 -- what is bought after the lock does not reach this match
 n:=jsonb_array_length(v->'lock'->'home'->'squad');
 execute 'reset role';
 select player into k from public.lg_pool p where not exists(select 1 from public.lg_squads s where s.league_id=lid and s.player=p.player) order by value limit 1;
 execute 'set local role authenticated';
 if n<22 then perform public.lg_buy(lid,k); end if;
 v:=public.lg_fixture_lock(fid,'another-build');
 assert jsonb_array_length(v->'lock'->'home'->'squad')=n and v->'lock'->>'sim'='v1','a locked match stays as it was locked';

 -- a penalty with the other manager away: his part is left to the match, at once
 v:=public.lg_pen(fid,0,'h','UL');
 assert (v->>'done')::boolean and v->>'k'='UL' and v->>'d' in ('UL','U','UR','L','R','DL','D','DR') and (v->>'ad')::boolean and not (v->>'ak')::boolean and (v->>'n')::bigint>=0,
  'an absent keeper does not hold the match up, and his dive is drawn by the server: '||v::text;
 begin perform public.lg_pen(fid,2,'h','UL');raise exception 'expected invalid_pen';
 exception when raise_exception then if sqlerrm<>'invalid_pen' then raise; end if;end;
 begin perform public.lg_pen(fid,0,'a','UL');raise exception 'expected pen_mismatch';
 exception when raise_exception then if sqlerrm<>'pen_mismatch' then raise; end if;end;
 begin perform public.lg_pen(fid,1,'h','XX');raise exception 'expected invalid_pen';
 exception when raise_exception then if sqlerrm<>'invalid_pen' then raise; end if;end;

 -- a penalty with both there: neither sees the other's choice before he has made his own
 perform set_config('request.jwt.claim.sub',away_::text,true);
 v:=public.lg_fixture_state(fid);assert v->>'mine'='a';
 perform set_config('request.jwt.claim.sub',home_::text,true);
 v:=public.lg_fixture_state(fid);assert (v->>'here')::boolean,'now he is here';
 v:=public.lg_pen(fid,1,'a','R');
 assert not (v->>'done')::boolean and (v->>'chosen')::boolean,'the keeper waits for the kick';
 v:=public.lg_pen(fid,1,'a','L');
 assert not (v->>'done')::boolean,'and cannot change his mind';
 begin perform public.lg_result(fid,1,0,'digest-one');raise exception 'expected penalty_open';
 exception when raise_exception then if sqlerrm<>'penalty_open' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',away_::text,true);
 v:=public.lg_fixture_state(fid);
 assert v->'pens'->1->>'t'='a' and not (v->'pens'->1->>'done')::boolean and v->'pens'->1->>'d' is null,'the kicker is told a penalty is open, not where the keeper is going';
 v:=public.lg_pen(fid,1,'a','DL');
 assert (v->>'done')::boolean and v->>'k'='DL' and v->>'d'='R' and not (v->>'ak')::boolean and not (v->>'ad')::boolean and v->>'n' is not null,'both choices, once both are in: '||v::text;
 perform set_config('request.jwt.claim.sub',home_::text,true);
 v:=public.lg_pen(fid,1,'a',null);
 assert (v->>'done')::boolean and v->>'k'='DL' and v->>'d'='R';
 assert (public.lg_fixture_state(fid)->'pens'->1->>'n')=(v->>'n'),'both phones are given the same number for the kick';

 -- two answers that differ: both are thrown away and the match is dealt again
 v:=public.lg_result(fid,2,1,'digest-one');assert v->>'state'='waiting';
 v:=public.lg_result(fid,9,0,'digest-xxx');assert v->>'state'='waiting','the first answer is the answer';
 begin perform public.lg_result(fid,31,0,'digest-one');raise exception 'expected invalid_result';
 exception when raise_exception then if sqlerrm<>'invalid_result' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',away_::text,true);
 v:=public.lg_result(fid,2,2,'digest-two');assert v->>'state'='conflict';
 execute 'reset role';
 select * into f from public.lg_fixtures where id=fid;
 assert f.lock is null and f.pens='[]'::jsonb and f.played_at is null and f.seed<>seed0 and not exists(select 1 from public.lg_results where fixture_id=fid),'a disputed match is dealt again from a new seed';
 execute 'set local role authenticated';

 -- two answers that agree: the match counts, the money is paid, the round moves on
 v:=public.lg_fixture_lock(fid,'v1');
 v:=public.lg_result(fid,1,3,'digest-same');assert v->>'state'='waiting';
 perform set_config('request.jwt.claim.sub',home_::text,true);
 v:=public.lg_fixture_lock(fid,'v1');assert (v->>'his')::boolean and not (v->>'answered')::boolean;
 v:=public.lg_result(fid,1,3,'digest-same');assert v->>'state'='final' and (v->>'ag')::int=3;
 v:=public.lg_result(fid,5,0,'digest-late');assert v->>'state'='final' and (v->>'hg')::int=1,'a played match is not replayed';
 execute 'reset role';
 assert (select sum(amount) from public.lg_ledger where league_id=lid and owner_id=away_ and reason='result')=2500000,'a win pays 2.5M';
 assert (select sum(amount) from public.lg_ledger where league_id=lid and owner_id=home_ and reason='result')=300000,'a defeat pays 0.3M';
 assert (select round from public.lg_leagues where id=lid)=2,'the evening is over when its matches are';
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',home_::text,true);
 begin perform public.lg_fixture_lock((select id from public.lg_fixtures where league_id=lid and round=4 limit 1),'v1');raise exception 'expected not_this_round or not_your_match';
 exception when raise_exception then if sqlerrm not in ('not_this_round','not_your_match') then raise; end if;when insufficient_privilege then null;end;

 -- the host ends an evening nobody came to: a goalless draw
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_round_close(lid);raise exception 'expected host_only';
 exception when raise_exception then if sqlerrm<>'host_only' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 v:=public.lg_round_close(lid);assert (v->>'closed')::int=1;
 execute 'reset role';
 select * into f from public.lg_fixtures where league_id=lid and season=1 and round=2;
 assert f.home_goals=0 and f.away_goals=0 and f.played_at is not null;
 assert (select round from public.lg_leagues where id=lid)=3;
 -- an evening one manager played stands as he played it
 select * into f from public.lg_fixtures where league_id=lid and season=1 and round=3;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',f.home_id::text,true);
 perform public.lg_fixture_lock(f.id,'v1');v:=public.lg_result(f.id,4,0,'digest-solo');assert v->>'state'='waiting';
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.lg_round_close(lid);
 execute 'reset role';
 assert (select home_goals from public.lg_fixtures where id=f.id)=4,'the one answer stands';
 -- a manager who opens his match, sees how it ends and leaves it has lost it
 select * into f from public.lg_fixtures where league_id=lid and season=1 and round=4;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',f.away_id::text,true);
 perform public.lg_fixture_lock(f.id,'v1');
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.lg_round_close(lid);
 execute 'reset role';
 assert (select home_goals from public.lg_fixtures where id=f.id)=3 and (select away_goals from public.lg_fixtures where id=f.id)=0,'opened and abandoned is a forfeit, not a draw';
 -- anybody may close an evening that has been open for two days
 update public.lg_leagues set round_started=now()-interval '49 hours' where id=lid;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',x::text,true);
 perform public.lg_round_close(lid);
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.lg_round_close(lid);
 begin perform public.lg_round_close(lid);raise exception 'expected no_season';
 exception when raise_exception then if sqlerrm<>'no_season' then raise; end if;end;

 -- the season's end: a final table, and the prize money paid once
 v:=public.lg_get(lid);
 assert v->>'phase'='done' and (v->'table'->0->>'pos')::int=1 and (select sum((t->>'p')::int) from jsonb_array_elements(v->'table') t)=12,'six matches, twelve appearances';
 execute 'reset role';
 assert (select count(*) from public.lg_ledger where league_id=lid and reason='prize')=3 and (select sum(amount) from public.lg_ledger where league_id=lid and reason='prize')=48000000,'20M, 16M and 12M';
 assert (select amount from public.lg_ledger where league_id=lid and reason='prize' and owner_id=(v->'table'->0->>'id')::uuid)=20000000,'the champion takes the first prize';
 for f in select owner_id, money from public.lg_members where league_id=lid loop
  assert f.money=(select sum(amount) from public.lg_ledger where league_id=lid and owner_id=f.owner_id),'the ledger is the balance';
 end loop;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_next_season(lid);raise exception 'expected host_only';
 exception when raise_exception then if sqlerrm<>'host_only' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 v:=public.lg_next_season(lid);assert (v->>'season')::int=2 and (v->>'fixtures')::int=6;
 v:=public.lg_get(lid);
 assert v->>'phase'='season' and (v->>'round')::int=1 and (v->>'season')::int=2 and (v->'table'->0->>'p')::int=0,'a new season, a clean table, the same squads';
 assert (v->'training'->>'star')::int=3,'what a player learned stays with him';
 begin perform public.lg_next_season(lid);raise exception 'expected season_running';
 exception when raise_exception then if sqlerrm<>'season_running' then raise; end if;end;

 -- none of it without the functions, and the helpers that move money are not a manager's to call
 execute 'reset role';
 assert not has_function_privilege('anon','public.lg_result(uuid,int,int,text)','execute') and not has_function_privilege('anon','public.lg_start(uuid)','execute');
 assert not has_function_privilege('authenticated','goalasso_private.lg_pay(uuid,uuid,bigint,text,text)','execute'),'a manager cannot pay himself';
 assert not has_function_privilege('authenticated','goalasso_private.lg_finalize(uuid,int,int)','execute'),'or write himself a result';
 assert not has_function_privilege('authenticated','goalasso_private.lg_fill(uuid,uuid,int,boolean)','execute');
 assert not has_table_privilege('authenticated','public.lg_fixtures','update') and not has_table_privilege('authenticated','public.lg_results','insert');
end $$;
select 'passed: host-only start with every squad made legal, a balanced squad built inside the budget, home-and-away fixtures, three training sessions a round, the lock that later purchases do not reach, penalties that hide a choice until both are in and do not wait for an absent manager, a result that needs two matching answers, a disputed match dealt again, win/draw/loss money, rounds closed by the host or by anyone after two days, a forfeit for a match opened and abandoned, a seed nobody sees before the lock, prizes paid once, a second season' as result;
rollback;
