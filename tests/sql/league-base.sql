-- Transactional backend regression for the shared league (20261114210000_shared_league.sql): nothing persists.
-- What it is really guarding is the one rule of docs/shared-league.md — a phone asks, the server decides — so
-- every check here is a thing a manager with a console would otherwise help himself to.
begin;
do $$
declare
 h uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); x uuid:=gen_random_uuid();
 lg jsonb; v jsonb; inv uuid; lid uuid; off uuid; i int;
begin
 insert into auth.users(id,aud,role) values(h,'authenticated','authenticated'),(g,'authenticated','authenticated'),(x,'authenticated','authenticated');
 -- the price list is the server's, not the client's
 insert into public.lg_pool(player,name,pos,age,value) values
  ('p-star','Star','ATT',27,30000000),('p-good','Good','MID',24,12000000),('p-cheap','Cheap','DEF',31,2000000),
  ('p-x1','X1','DEF',22,1000000),('p-x2','X2','MID',22,1000000),('p-x3','X3','ATT',22,1000000);
 for i in 1..24 loop insert into public.lg_pool(player,name,value) values('f-'||i,'Filler '||i,1000000); end loop;

 execute 'set local role authenticated';
 -- nobody signed in
 perform set_config('request.jwt.claim.sub','',true);
 begin perform public.lg_create('League','Team',4);raise exception 'expected login_required';
 exception when raise_exception then if sqlerrm<>'login_required' then raise; end if;end;

 -- the host
 perform set_config('request.jwt.claim.sub',h::text,true);
 begin perform public.lg_create('  ','Team',4);raise exception 'expected invalid_name';
 exception when raise_exception then if sqlerrm<>'invalid_name' then raise; end if;end;
 begin perform public.lg_create('League','',4);raise exception 'expected invalid_team';
 exception when raise_exception then if sqlerrm<>'invalid_team' then raise; end if;end;
 begin perform public.lg_create('League','Team',9);raise exception 'expected invalid_capacity';
 exception when raise_exception then if sqlerrm<>'invalid_capacity' then raise; end if;end;
 lg:=public.lg_create('Thursday Night',' Red Wolves ',2);lid:=(lg->>'id')::uuid;inv:=(lg->>'invitation')::uuid;
 assert lid is not null and inv is not null and lid<>inv,'the invitation is not the league id';
 v:=public.lg_get(lid);
 assert (v->>'host')::boolean and v->'members'->0->>'team'='Red Wolves','the team name is trimmed';
 assert (v->'members'->0->>'money')::bigint=60000000,'everyone starts on the same budget';
 assert v->>'invitation'=inv::text,'the host is given the invitation';

 -- the invitation card, before anybody signs in
 execute 'reset role';perform set_config('request.jwt.claim.sub','',true);execute 'set local role anon';
 v:=public.lg_preview_invitation(inv);
 assert v->>'league'='Thursday Night' and v->>'team'='Red Wolves' and (v->>'members')::int=1 and not (v->>'full')::boolean;
 begin perform public.lg_preview_invitation(lid);raise exception 'expected invitation_expired';
 exception when raise_exception then if sqlerrm<>'invitation_expired' then raise; end if;end;
 -- nothing of the league is reachable without a function
 assert not has_table_privilege('anon','public.lg_leagues','select') and not has_table_privilege('anon','public.lg_members','select');
 assert not has_table_privilege('anon','public.lg_squads','select') and not has_table_privilege('anon','public.lg_pool','select');
 assert not has_function_privilege('anon','public.lg_buy(uuid,text)','execute');
 assert not has_schema_privilege('anon','goalasso_private','usage');
 execute 'reset role';execute 'set local role authenticated';

 -- the guest
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_join(inv,'Red Wolves');raise exception 'expected team_taken';
 exception when raise_exception then if sqlerrm<>'team_taken' then raise; end if;end;
 assert (public.lg_join(inv,'Blue Hawks')->>'id')::uuid=lid;
 assert (public.lg_join(inv,'Anything Else')->>'id')::uuid=lid,'joining twice changes nothing';
 v:=public.lg_get(lid);
 assert jsonb_array_length(v->'members')=2 and not (v->>'host')::boolean and v->>'invitation' is null,'a guest is not given the invitation';
 -- a third manager, with the league full at two
 perform set_config('request.jwt.claim.sub',x::text,true);
 begin perform public.lg_join(inv,'Late Arrivals');raise exception 'expected league_full';
 exception when raise_exception then if sqlerrm<>'league_full' then raise; end if;end;
 begin perform public.lg_get(lid);raise exception 'expected not_a_member';
 exception when raise_exception then if sqlerrm<>'not_a_member' then raise; end if;end;
 begin perform public.lg_buy(lid,'p-cheap');raise exception 'expected not_a_member';
 exception when raise_exception then if sqlerrm<>'not_a_member' then raise; end if;end;

 -- identity: a tier is bought once, a step down is not refunded
 perform set_config('request.jwt.claim.sub',h::text,true);
 v:=public.lg_set_identity(lid,null,'{"tier":"custom","shape":"shield"}'::jsonb,null);
 assert (v->>'charged')::bigint=1000000 and (v->>'money')::bigint=59000000;
 v:=public.lg_set_identity(lid,null,'{"tier":"premium","shape":"shield"}'::jsonb,null);
 assert (v->>'charged')::bigint=1000000,'only the step up is charged';
 v:=public.lg_set_identity(lid,null,'{"tier":"free"}'::jsonb,null);
 assert (v->>'charged')::bigint=0 and (v->>'money')::bigint=58000000,'a step down is not a refund';
 begin perform public.lg_set_identity(lid,null,'{"tier":"gold"}'::jsonb,null);raise exception 'expected invalid_crest';
 exception when raise_exception then if sqlerrm<>'invalid_crest' then raise; end if;end;
 v:=public.lg_set_identity(lid,'Red Wolves FC',null,'{"tier":"pattern","c1":"#c00"}'::jsonb);
 assert (v->>'charged')::bigint=500000 and v->>'team'='Red Wolves FC';

 -- the market: the price is the pool's
 begin perform public.lg_buy(lid,'nobody');raise exception 'expected unknown_player';
 exception when raise_exception then if sqlerrm<>'unknown_player' then raise; end if;end;
 v:=public.lg_buy(lid,'p-star');
 assert (v->>'paid')::bigint=30000000 and (v->>'money')::bigint=27500000;
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_buy(lid,'p-star');raise exception 'expected player_taken';
 exception when raise_exception then if sqlerrm<>'player_taken' then raise; end if;end;
 -- and the budget is real
 perform public.lg_buy(lid,'p-good');
 begin for i in 1..24 loop perform public.lg_buy(lid,'f-'||i); end loop; raise exception 'expected squad_full';
 exception when raise_exception then if sqlerrm not in ('squad_full','no_money') then raise; end if;end;
 assert goalasso_private.lg_squad_size(lid,g)<=22,'a squad never passes 22';

 -- selling back is a discount, and only of your own player
 perform set_config('request.jwt.claim.sub',h::text,true);
 begin perform public.lg_sell(lid,'p-good');raise exception 'expected not_yours';
 exception when raise_exception then if sqlerrm<>'not_yours' then raise; end if;end;
 v:=public.lg_sell(lid,'p-star');
 assert (v->>'back')::bigint=21000000 and (v->>'money')::bigint=48500000,'70% comes back, never more';

 -- a trade moves both sides together
 perform public.lg_buy(lid,'p-cheap');
 begin perform public.lg_offer(lid,h,'{}','{}',0);raise exception 'expected no_such_manager';
 exception when raise_exception then if sqlerrm<>'no_such_manager' then raise; end if;end;
 begin perform public.lg_offer(lid,g,'{p-good}','{}',0);raise exception 'expected not_yours';
 exception when raise_exception then if sqlerrm<>'not_yours' then raise; end if;end;
 off:=(public.lg_offer(lid,g,'{p-cheap}','{p-good}',3000000)->>'id')::uuid;
 begin perform public.lg_respond(off,true);raise exception 'expected not_yours';
 exception when raise_exception then if sqlerrm<>'not_yours' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',g::text,true);
 perform public.lg_respond(off,true);
 execute 'reset role';
 assert (select owner_id from public.lg_squads where league_id=lid and player='p-good')=h,'the wanted player changed hands';
 assert (select owner_id from public.lg_squads where league_id=lid and player='p-cheap')=g,'and so did the offered one';
 execute 'set local role authenticated';
 begin perform public.lg_respond(off,true);raise exception 'expected no_such_offer';
 exception when raise_exception then if sqlerrm<>'no_such_offer' then raise; end if;end;

 -- an offer whose player has since been sold is refused, not half-applied
 perform set_config('request.jwt.claim.sub',h::text,true);
 off:=(public.lg_offer(lid,g,'{p-good}','{p-cheap}',0)->>'id')::uuid;
 perform public.lg_sell(lid,'p-good');
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin perform public.lg_respond(off,true);raise exception 'expected offer_stale';
 exception when raise_exception then if sqlerrm<>'offer_stale' then raise; end if;end;

 -- every shekel is accounted for
 execute 'reset role';
 assert (select owner_id from public.lg_squads where league_id=lid and player='p-cheap')=g,'nothing moved';
 assert (select money from public.lg_members where league_id=lid and owner_id=h)
      = (select sum(amount) from public.lg_ledger where league_id=lid and owner_id=h),'the ledger is the balance';
 assert (select money from public.lg_members where league_id=lid and owner_id=g)
      = (select sum(amount) from public.lg_ledger where league_id=lid and owner_id=g),'the ledger is the balance';
 assert not has_table_privilege('authenticated','public.lg_members','update') and not has_table_privilege('authenticated','public.lg_squads','insert');
 assert not has_table_privilege('authenticated','public.lg_ledger','select') and not has_table_privilege('authenticated','public.lg_pool','update');

 -- a season that has started takes no new managers and keeps a squad legal
 update public.lg_leagues set phase='season' where id=lid;
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',x::text,true);
 begin perform public.lg_join(inv,'Too Late');raise exception 'expected league_started';
 exception when raise_exception then if sqlerrm<>'league_started' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.lg_buy(lid,'p-x1');
 begin perform public.lg_sell(lid,'p-x1');raise exception 'expected squad_too_small';
 exception when raise_exception then if sqlerrm<>'squad_too_small' then raise; end if;end;
 execute 'reset role';
end $$;
select 'passed: sign-in gate, invitation card, one team per name, league size, tier charges without refunds, server-side prices, 22-player cap, 70% sell-back, a trade that moves both sides or neither, the ledger equals the balance, privacy of every table' as result;
rollback;
