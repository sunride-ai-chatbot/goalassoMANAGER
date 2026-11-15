-- GOALASSO · ליגה משותפת — the season: fixtures, matches, penalties, training, the table and the prizes.
-- Paste the whole file into the SQL Editor and press Run, AFTER install-league.sql.
-- It is supabase/migrations/20261115120000_shared_league_season.sql plus a schema reload at the end.
--
-- Then paste install-league-pool.sql the same way: that one is the price list of all the real players, and
-- without it nobody can buy anybody (an empty pool sells nothing — it does not sell everything for free).
--
-- This file may be run again: it replaces the functions and adds only what is missing, so a later version of
-- it is installed the same way.

-- Shared league, steps 3–7 of docs/shared-league.md: the season. Applied on top of 20261114210000_shared_league.sql.
--
-- What the first file left open is everything that happens after the squads are bought: the fixtures, the
-- evening's matches, the penalties, training, the table and the prize money. The rule does not change — a phone
-- asks and the server decides — but a match cannot be decided here, because the engine is JavaScript and this is
-- Postgres. So the server does the next best thing, and does all of it:
--
--   * it draws the seed and LOCKS what the match is played with (both squads, both line-ups, every player's
--     training) the first time either manager opens the fixture. Nothing bought, sold or trained afterwards
--     reaches that match, and both phones simulate exactly the same thing;
--   * it keeps the penalties. A penalty is a duel between the two managers, and neither may see the other's
--     choice first, so each choice is handed to the server and comes back only when both are in;
--   * it takes one answer from each manager and counts the result only when the two agree. A manager with a
--     console can no longer write himself a win: his opponent's phone ran the same match and says otherwise.
--
-- A manager who never shows up does not freeze the league: his penalties are taken for him, his opponent's
-- answer stands when the host closes the round, and a match nobody played is a goalless draw.

alter table public.lg_leagues  add column if not exists round_started timestamptz;
alter table public.lg_members  add column if not exists setup jsonb not null default '{}'::jsonb,
                               add column if not exists ground int not null default 0 check (ground between 0 and 5);
alter table public.lg_fixtures add column if not exists lock jsonb,
                               add column if not exists pens jsonb not null default '[]'::jsonb,
                               add column if not exists seen_home timestamptz,
                               add column if not exists seen_away timestamptz;
-- whether the game has a freely licensed photograph of the player: a squad built for a manager prefers faces he
-- will recognise to names he has never heard, at the same price
alter table public.lg_pool     add column if not exists face boolean not null default false;
create index if not exists lg_pool_pick on public.lg_pool(pos, value desc);
create index if not exists lg_training_player on public.lg_training(league_id, player);

-- ---------------------------------------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------------------------------------
create or replace function goalasso_private.lg_member(p_league uuid) returns public.lg_leagues language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into l from public.lg_leagues where id=p_league and expires_at>now() for update;
 if l.id is null or not exists(select 1 from public.lg_members where league_id=p_league and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 return l;
end $$;

-- The table of a season, best first: points, goal difference, goals scored, then who joined first.
create or replace function goalasso_private.lg_standings(p_league uuid, p_season int)
returns table(owner_id uuid, played int, won int, drawn int, lost int, gf int, ga int, pts int, pos int)
language sql stable security definer set search_path='' as $$
 with rows_ as (
  select f.home_id o, f.home_goals gf, f.away_goals ga from public.lg_fixtures f where f.league_id=p_league and f.season=p_season and f.played_at is not null
  union all
  select f.away_id, f.away_goals, f.home_goals from public.lg_fixtures f where f.league_id=p_league and f.season=p_season and f.played_at is not null
 ), agg as (
  select m.owner_id, m.joined_at,
   count(r.o)::int played,
   count(*) filter (where r.gf>r.ga)::int won, count(*) filter (where r.gf=r.ga)::int drawn, count(*) filter (where r.gf<r.ga)::int lost,
   coalesce(sum(r.gf),0)::int gf, coalesce(sum(r.ga),0)::int ga
  from public.lg_members m left join rows_ r on r.o=m.owner_id where m.league_id=p_league group by m.owner_id, m.joined_at
 )
 select a.owner_id, a.played, a.won, a.drawn, a.lost, a.gf, a.ga, a.won*3+a.drawn,
  (row_number() over (order by a.won*3+a.drawn desc, a.gf-a.ga desc, a.gf desc, a.joined_at))::int
 from agg a
$$;

-- Everyone plays everyone, home and away (the circle method). An odd league gives one manager a free evening.
create or replace function goalasso_private.lg_make_fixtures(p_league uuid, p_season int) returns int language plpgsql security definer set search_path='' as $$
declare ids uuid[]; n int; m int; r int; i int; a uuid; b uuid; tmp uuid; made int:=0;
begin
 select array_agg(owner_id order by joined_at) into ids from public.lg_members where league_id=p_league;
 n:=coalesce(array_length(ids,1),0);
 if n<2 then raise exception 'not_enough_managers'; end if;
 if n%2=1 then ids:=ids||null::uuid; end if;
 m:=array_length(ids,1);
 for r in 0..m-2 loop
  for i in 1..m/2 loop
   a:=ids[i]; b:=ids[m+1-i];
   if a is not null and b is not null then
    -- the home side alternates, so nobody plays a run of evenings at home
    if (r+i)%2=1 then tmp:=a; a:=b; b:=tmp; end if;
    insert into public.lg_fixtures(league_id,season,round,home_id,away_id,seed) values(p_league,p_season,r+1,a,b,floor(random()*2147483000)::bigint);
    insert into public.lg_fixtures(league_id,season,round,home_id,away_id,seed) values(p_league,p_season,r+m,b,a,floor(random()*2147483000)::bigint);
    made:=made+2;
   end if;
  end loop;
  -- rotate everything but the first seat
  ids:=ids[1:1]||ids[m:m]||ids[2:m-1];
 end loop;
 return made;
end $$;

-- Fill a squad up to p_target with real players it can pay for: an eleven first (4-3-3), then a bench.
--
-- The money is not spread evenly. Fourteen players at exactly the same price are fourteen players of exactly
-- the same rating, which is a squad nobody would pick and nobody can tell apart; so each place has a weight — a
-- striker and a playmaker carry the most, the bench the least — and takes that share of what there is to spend.
-- What a place does not use is carried to the next. A sixth of the purse is left in the bank: a squad with
-- nothing over for one more signing, a trade or the training ground is a squad that can never be changed.
-- Within a quarter of its share a place prefers a player the game has a photograph of.
--
-- Used by the "build me a squad" button and for a manager who has not finished buying when the host starts.
-- p_free is the start of a season only: a manager who spent everything on three stars still has to field a
-- team, so the places he cannot pay for are filled with the cheapest players there are, for nothing. It is not
-- a loophole worth having — eleven of the cheapest are worth about a million between them.
create or replace function goalasso_private.lg_fill(p_league uuid, p_owner uuid, p_target int, p_free boolean default false) returns int language plpgsql security definer set search_path='' as $$
declare
 slots text[]:=array['GK','DF','DF','DF','DF','MF','MF','MF','FW','FW','FW','GK','DF','MF','FW','MF','DF','MF','FW','DF','MF','FW'];
 wts numeric[]:=array[1.0,1.0,1.0,1.2,1.2,1.3,1.5,1.9,1.5,2.0,2.8,.3,.3,.3,.3,.3,.3,.3,.3,.3,.3,.3];
 have jsonb; i int; k text; n int; left_ bigint; spend bigint; total numeric:=0; carry bigint:=0; cap bigint; price bigint; pick_ record; bought int:=0; open_ int[]:='{}';
begin
 p_target:=least(p_target,22);
 select coalesce(jsonb_object_agg(x.pos,x.n),'{}'::jsonb) into have from (
  select coalesce(p.pos,'MF') pos, count(*) n from public.lg_squads s left join public.lg_pool p on p.player=s.player
  where s.league_id=p_league and s.owner_id=p_owner group by 1) x;
 -- the places still empty: walk the shape, letting the players he already has take the first places of their line
 for i in 1..p_target loop
  k:=slots[i]; n:=coalesce((have->>k)::int,0);
  if n>0 then have:=have||jsonb_build_object(k,n-1); else open_:=open_||i; total:=total+wts[i]; end if;
 end loop;
 -- players beyond the shape (a fifth forward, say) still count towards the size
 n:=goalasso_private.lg_squad_size(p_league,p_owner);
 select money into left_ from public.lg_members where league_id=p_league and owner_id=p_owner;
 spend:=left_-left_/6;
 foreach i in array open_ loop
  exit when n>=p_target;
  select money into left_ from public.lg_members where league_id=p_league and owner_id=p_owner;
  cap:=least(left_,(spend*wts[i]/total)::bigint+carry);
  select p.player, p.value into pick_ from public.lg_pool p
   where p.pos=slots[i] and p.value<=cap
     and not exists(select 1 from public.lg_squads s where s.league_id=p_league and s.player=p.player)
   order by (p.face and p.value>=cap*3/4) desc, p.value desc, p.player limit 1;
  if pick_.player is null then
   -- nothing under the share: the cheapest there is, if it can be paid for at all
   select p.player, p.value into pick_ from public.lg_pool p
    where p.pos=slots[i] and p.value<=left_
      and not exists(select 1 from public.lg_squads s where s.league_id=p_league and s.player=p.player)
    order by p.value, p.player limit 1;
  end if;
  price:=pick_.value;
  if pick_.player is null and p_free then
   select p.player, p.value into pick_ from public.lg_pool p
    where p.pos=slots[i]
      and not exists(select 1 from public.lg_squads s where s.league_id=p_league and s.player=p.player)
    order by p.value, p.player limit 1;
   price:=0;
  end if;
  continue when pick_.player is null;
  if price>0 then perform goalasso_private.lg_pay(p_league,p_owner,-price,'buy',pick_.player); end if;
  insert into public.lg_squads(league_id,player,owner_id,paid) values(p_league,pick_.player,p_owner,price);
  carry:=greatest(cap-price,0); bought:=bought+1; n:=n+1;
 end loop;
 return bought;
end $$;

-- The season is over when its last round is: the table is final and the prize money is paid into the next one.
create or replace function goalasso_private.lg_advance(p_league uuid) returns void language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; s record; prize bigint;
begin
 select * into l from public.lg_leagues where id=p_league for update;
 if l.phase<>'season' then return; end if;
 if exists(select 1 from public.lg_fixtures where league_id=p_league and season=l.season and round=l.round and played_at is null) then return; end if;
 if exists(select 1 from public.lg_fixtures where league_id=p_league and season=l.season and round>l.round) then
  update public.lg_leagues set round=(select min(round) from public.lg_fixtures where league_id=p_league and season=l.season and round>l.round), round_started=now() where id=p_league;
  return;
 end if;
 for s in select * from goalasso_private.lg_standings(p_league,l.season) loop
  prize:=case s.pos when 1 then 20000000 when 2 then 16000000 when 3 then 12000000 when 4 then 8000000 when 5 then 4000000 else 0 end;
  if prize>0 then perform goalasso_private.lg_pay(p_league,s.owner_id,prize,'prize','season '||l.season||' place '||s.pos); end if;
 end loop;
 update public.lg_leagues set phase='done' where id=p_league;
end $$;

create or replace function goalasso_private.lg_finalize(p_fixture uuid, p_home int, p_away int) returns void language plpgsql security definer set search_path='' as $$
declare f public.lg_fixtures;
begin
 update public.lg_fixtures set home_goals=p_home, away_goals=p_away, played_at=now() where id=p_fixture and played_at is null returning * into f;
 if f.id is null then return; end if;
 perform goalasso_private.lg_pay(f.league_id,f.home_id,case when p_home>p_away then 2500000 when p_home=p_away then 1000000 else 300000 end,'result',null);
 perform goalasso_private.lg_pay(f.league_id,f.away_id,case when p_away>p_home then 2500000 when p_home=p_away then 1000000 else 300000 end,'result',null);
 perform goalasso_private.lg_advance(f.league_id);
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- the lobby, extended: one call paints every screen of the league
-- ---------------------------------------------------------------------------------------------------------
create or replace function goalasso_private.lg_get(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into l from public.lg_leagues where id=p_league and expires_at>now();
 if l.id is null or not exists(select 1 from public.lg_members where league_id=p_league and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 update public.lg_members set last_seen=now() where league_id=p_league and owner_id=auth.uid();
 return jsonb_build_object(
  'id',l.id,'name',l.name,'invitation',case when l.host_id=auth.uid() then l.invitation else null end,
  'host',l.host_id=auth.uid(),'capacity',l.capacity,'budget',l.budget,'season',l.season,'round',l.round,'phase',l.phase,
  'me',auth.uid(),'round_started',l.round_started,
  'pool',(select count(*) from public.lg_pool),
  'members',(select coalesce(jsonb_agg(jsonb_build_object(
     'id',m.owner_id,'mine',m.owner_id=auth.uid(),'host',m.owner_id=l.host_id,'team',m.team,'crest',m.crest,'kit',m.kit,
     'money',m.money,'ground',m.ground,'squad',goalasso_private.lg_squad_size(p_league,m.owner_id),'seen',m.last_seen)
    order by m.joined_at),'[]'::jsonb) from public.lg_members m where m.league_id=p_league),
  'setup',(select m.setup from public.lg_members m where m.league_id=p_league and m.owner_id=auth.uid()),
  'squad',(select coalesce(jsonb_agg(jsonb_build_object('player',s.player,'paid',s.paid) order by s.bought_at),'[]'::jsonb)
    from public.lg_squads s where s.league_id=p_league and s.owner_id=auth.uid()),
  'squads',(select coalesce(jsonb_agg(jsonb_build_object('player',s.player,'owner',s.owner_id) order by s.player),'[]'::jsonb)
    from public.lg_squads s where s.league_id=p_league),
  'taken',(select coalesce(jsonb_agg(s.player),'[]'::jsonb) from public.lg_squads s where s.league_id=p_league),
  'fixtures',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'round',f.round,'home',f.home_id,'away',f.away_id,
     'hg',f.home_goals,'ag',f.away_goals,'played',f.played_at is not null,'locked',f.lock is not null,
     'answers',(select coalesce(jsonb_agg(r.owner_id),'[]'::jsonb) from public.lg_results r where r.fixture_id=f.id))
    order by f.round, f.id),'[]'::jsonb) from public.lg_fixtures f where f.league_id=p_league and f.season=l.season),
  'table',(select coalesce(jsonb_agg(jsonb_build_object('id',s.owner_id,'p',s.played,'w',s.won,'d',s.drawn,'l',s.lost,'gf',s.gf,'ga',s.ga,'pts',s.pts,'pos',s.pos) order by s.pos),'[]'::jsonb)
    from goalasso_private.lg_standings(p_league,l.season) s),
  'offers',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'from',o.from_id,'to',o.to_id,'give',o.give,'want',o.want,'cash',o.cash) order by o.created_at),'[]'::jsonb)
    from public.lg_offers o where o.league_id=p_league and o.state='open' and auth.uid() in (o.from_id,o.to_id)),
  'trained',(select count(*) from public.lg_training t where t.league_id=p_league and t.owner_id=auth.uid() and t.season=l.season and t.round=l.round),
  'training',(select coalesce(jsonb_object_agg(x.player,x.n),'{}'::jsonb) from (select t.player, count(*) n from public.lg_training t where t.league_id=p_league group by t.player) x),
  'ledger',(select coalesce(jsonb_agg(jsonb_build_object('amount',g.amount,'reason',g.reason,'note',g.note) order by g.id desc),'[]'::jsonb)
    from (select * from public.lg_ledger where league_id=p_league and owner_id=auth.uid() order by id desc limit 14) g));
end $$;

-- prices are not a secret; they are simply not the client's to state
create or replace function goalasso_private.lg_prices(p_players text[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 if coalesce(array_length(p_players,1),0)>400 then raise exception 'too_many'; end if;
 return (select coalesce(jsonb_object_agg(p.player,p.value),'{}'::jsonb) from public.lg_pool p where p.player=any(p_players));
end $$;

create or replace function goalasso_private.lg_autofill(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; n int;
begin
 l:=goalasso_private.lg_member(p_league);
 if not exists(select 1 from public.lg_pool) then raise exception 'pool_empty'; end if;
 n:=goalasso_private.lg_fill(p_league,auth.uid(),16);
 if n=0 and goalasso_private.lg_squad_size(p_league,auth.uid())<14 then raise exception 'no_money'; end if;
 return jsonb_build_object('bought',n,'squad',goalasso_private.lg_squad_size(p_league,auth.uid()),
  'money',(select money from public.lg_members where league_id=p_league and owner_id=auth.uid()));
end $$;

-- formation, eleven and mentality. Nothing is checked here beyond its size: what a line-up is worth is decided
-- when a match is locked, against the squad of that moment, and a name that is no longer there is simply not picked.
create or replace function goalasso_private.lg_setup(p_league uuid, p_setup jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 l:=goalasso_private.lg_member(p_league);
 if p_setup is null or jsonb_typeof(p_setup)<>'object' or octet_length(p_setup::text)>3000 then raise exception 'invalid_setup'; end if;
 update public.lg_members set setup=p_setup where league_id=p_league and owner_id=auth.uid();
 return p_setup;
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- the season
-- ---------------------------------------------------------------------------------------------------------
create or replace function goalasso_private.lg_start(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; m record; n int;
begin
 l:=goalasso_private.lg_member(p_league);
 if l.host_id<>auth.uid() then raise exception 'host_only'; end if;
 if l.phase<>'build' then raise exception 'league_started'; end if;
 if (select count(*) from public.lg_members where league_id=p_league)<2 then raise exception 'not_enough_managers'; end if;
 if not exists(select 1 from public.lg_pool) then raise exception 'pool_empty'; end if;
 -- nobody is left without a team because he had not finished shopping
 for m in select owner_id from public.lg_members where league_id=p_league loop
  if goalasso_private.lg_squad_size(p_league,m.owner_id)<14 then perform goalasso_private.lg_fill(p_league,m.owner_id,14,true); end if;
 end loop;
 n:=goalasso_private.lg_make_fixtures(p_league,l.season);
 update public.lg_leagues set phase='season', round=1, round_started=now() where id=p_league;
 return jsonb_build_object('fixtures',n);
end $$;

create or replace function goalasso_private.lg_next_season(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; n int;
begin
 l:=goalasso_private.lg_member(p_league);
 if l.host_id<>auth.uid() then raise exception 'host_only'; end if;
 if l.phase<>'done' then raise exception 'season_running'; end if;
 if l.season>=99 then raise exception 'league_over'; end if;
 n:=goalasso_private.lg_make_fixtures(p_league,l.season+1);
 update public.lg_leagues set season=l.season+1, phase='season', round=1, round_started=now(), expires_at=now()+interval '180 days' where id=p_league;
 return jsonb_build_object('season',l.season+1,'fixtures',n);
end $$;

-- What a penalty looks like to a caller: the two choices once both are in, and until then only that it is open
-- and which side kicks. A choice is never shown to the other manager before he has made his own.
create or replace function goalasso_private.lg_pens_view(p jsonb) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(case when (e->>'done')::boolean then jsonb_build_object('t',e->>'t','k',e->>'k','d',e->>'d','n',e->'n','ak',coalesce((e->>'ak')::boolean,false),'ad',coalesce((e->>'ad')::boolean,false),'done',true)
   else jsonb_build_object('t',e->>'t','done',false) end order by o),'[]'::jsonb)
 from jsonb_array_elements(coalesce(p,'[]'::jsonb)) with ordinality x(e,o)
$$;

-- The seed is part of the view only once the fixture is locked. Before that a manager who could read it could
-- try line-ups against the match he is about to play and save the one that wins; after it, what he would be
-- trying them on can no longer change.
create or replace function goalasso_private.lg_fixture_view(f public.lg_fixtures) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',f.id,'round',f.round,'seed',case when f.lock is not null then f.seed end,'lock',f.lock,'mine',case when f.home_id=auth.uid() then 'h' else 'a' end,
  'pens',goalasso_private.lg_pens_view(f.pens),'played',f.played_at is not null,'hg',f.home_goals,'ag',f.away_goals,
  'answered',exists(select 1 from public.lg_results r where r.fixture_id=f.id and r.owner_id=auth.uid()),
  'his',exists(select 1 from public.lg_results r where r.fixture_id=f.id and r.owner_id<>auth.uid()),
  'here',coalesce((case when f.home_id=auth.uid() then f.seen_away else f.seen_home end)>now()-interval '9 seconds',false))
$$;

-- Opening a fixture locks it: the squads, the line-ups and every player's training as they stand at this
-- moment are written into the fixture and are what both phones will simulate. p_sim is the fingerprint of the
-- engine and data of the phone that locks; a phone on another build is told so instead of quietly disagreeing.
create or replace function goalasso_private.lg_fixture_lock(p_fixture uuid, p_sim text) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.lg_fixtures; l public.lg_leagues; side jsonb[]; o uuid; i int:=0;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into f from public.lg_fixtures where id=p_fixture for update;
 if f.id is null or auth.uid() not in (f.home_id,f.away_id) then raise exception 'not_your_match'; end if;
 select * into l from public.lg_leagues where id=f.league_id;
 if f.played_at is null and f.lock is null then
  if l.phase<>'season' or f.season<>l.season or f.round<>l.round then raise exception 'not_this_round'; end if;
  if p_sim is null or length(p_sim) not between 1 and 40 then raise exception 'invalid_sim'; end if;
  foreach o in array array[f.home_id,f.away_id] loop
   side[i]:=(select jsonb_build_object('team',m.team,'crest',m.crest,'kit',m.kit,'ground',m.ground,'setup',m.setup,
     'squad',(select coalesce(jsonb_agg(jsonb_build_object('p',s.player,'t',(select count(*) from public.lg_training t where t.league_id=f.league_id and t.player=s.player)) order by s.player),'[]'::jsonb)
       from public.lg_squads s where s.league_id=f.league_id and s.owner_id=o))
    from public.lg_members m where m.league_id=f.league_id and m.owner_id=o);
   i:=i+1;
  end loop;
  update public.lg_fixtures set lock=jsonb_build_object('sim',p_sim,'by',auth.uid(),'home',side[0],'away',side[1]) where id=p_fixture returning * into f;
 end if;
 if f.home_id=auth.uid() then update public.lg_fixtures set seen_home=now() where id=p_fixture returning * into f;
 else update public.lg_fixtures set seen_away=now() where id=p_fixture returning * into f; end if;
 return goalasso_private.lg_fixture_view(f);
end $$;

-- "I am here, what has changed": called every few seconds from the match screen.
create or replace function goalasso_private.lg_fixture_state(p_fixture uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.lg_fixtures;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into f from public.lg_fixtures where id=p_fixture;
 if f.id is null or auth.uid() not in (f.home_id,f.away_id) then raise exception 'not_your_match'; end if;
 if f.home_id=auth.uid() then update public.lg_fixtures set seen_home=now() where id=p_fixture returning * into f;
 else update public.lg_fixtures set seen_away=now() where id=p_fixture returning * into f; end if;
 return goalasso_private.lg_fixture_view(f);
end $$;

-- A penalty. p_idx is its number in the match, p_side the side that kicks ('h' or 'a'), p_dir the caller's
-- choice — where he shoots if his side kicks, where he dives if it does not — or null to ask whether the other
-- has chosen yet. The first choice a manager sends is the one that counts.
--
-- A manager who is not at the match does not hold it up: if he has not been seen at this fixture for nine
-- seconds his direction is drawn here, and the same after twenty seconds of a manager who is there and does not
-- answer ('ak' / 'ad' mark a kick or a dive that was drawn for him).
--
-- Nothing about a penalty can be worked out in advance from the fixture's seed. The absent side's direction is
-- drawn at the moment it is needed, and when both choices are in the server adds a number of its own ('n') that
-- the phones use for where the ball really goes and whether a keeper who guessed right holds it. A manager who
-- simulates the match on his own before choosing learns nothing about the kick he is about to take.
create or replace function goalasso_private.lg_pen(p_fixture uuid, p_idx int, p_side text, p_dir text) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.lg_fixtures; e jsonb; n int; kicker boolean; mine text; his text; his_seen timestamptz; since timestamptz;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into f from public.lg_fixtures where id=p_fixture for update;
 if f.id is null or auth.uid() not in (f.home_id,f.away_id) then raise exception 'not_your_match'; end if;
 if f.lock is null or f.played_at is not null then raise exception 'not_in_play'; end if;
 if p_side not in ('h','a') then raise exception 'invalid_pen'; end if;
 if p_dir is not null and p_dir not in ('U','UR','R','DR','D','DL','L','UL') then raise exception 'invalid_pen'; end if;
 n:=jsonb_array_length(f.pens);
 if p_idx is null or p_idx<0 or p_idx>n or p_idx>11 then raise exception 'invalid_pen'; end if;
 if p_idx=n then
  e:=jsonb_build_object('t',p_side,'k',null,'d',null,'done',false);
  f.pens:=f.pens||jsonb_build_array(e);
 else
  e:=f.pens->p_idx;
  if e->>'t'<>p_side then raise exception 'pen_mismatch'; end if;
 end if;
 if not (e->>'done')::boolean then
  kicker:=(p_side='h' and auth.uid()=f.home_id) or (p_side='a' and auth.uid()=f.away_id);
  mine:=case when kicker then 'k' else 'd' end; his:=case when kicker then 'd' else 'k' end;
  if p_dir is not null and e->>mine is null then
   e:=e||jsonb_build_object(mine,p_dir,mine||'t',to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS'));
  end if;
  if e->>mine is not null and e->>his is null then
   his_seen:=case when auth.uid()=f.home_id then f.seen_away else f.seen_home end;
   since:=(e->>(mine||'t'))::timestamp at time zone 'utc';
   if his_seen is null or his_seen<clock_timestamp()-interval '9 seconds' or since<clock_timestamp()-interval '20 seconds' then
    e:=e||jsonb_build_object(his,(array['UL','U','UR','L','R','DL','D','DR'])[1+floor(random()*8)::int],'a'||his,true);
   end if;
  end if;
  if e->>'k' is not null and e->>'d' is not null then e:=e||jsonb_build_object('done',true,'n',floor(random()*2147483000)::bigint); end if;
  f.pens:=jsonb_set(f.pens,array[p_idx::text],e);
 end if;
 if f.home_id=auth.uid() then update public.lg_fixtures set pens=f.pens, seen_home=now() where id=p_fixture;
 else update public.lg_fixtures set pens=f.pens, seen_away=now() where id=p_fixture; end if;
 if (e->>'done')::boolean then return jsonb_build_object('done',true,'t',e->>'t','k',e->>'k','d',e->>'d','n',e->'n','ak',coalesce((e->>'ak')::boolean,false),'ad',coalesce((e->>'ad')::boolean,false)); end if;
 return jsonb_build_object('done',false,'t',e->>'t','chosen',e->>(case when (p_side='h' and auth.uid()=f.home_id) or (p_side='a' and auth.uid()=f.away_id) then 'k' else 'd' end) is not null);
end $$;

-- One answer from each manager; the match counts when the two are the same match. Answers that differ are both
-- thrown away and the fixture is dealt again from a new seed: nobody's version wins an argument.
create or replace function goalasso_private.lg_result(p_fixture uuid, p_home int, p_away int, p_digest text) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.lg_fixtures; mine public.lg_results; his public.lg_results;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into f from public.lg_fixtures where id=p_fixture for update;
 if f.id is null or auth.uid() not in (f.home_id,f.away_id) then raise exception 'not_your_match'; end if;
 if f.played_at is not null then return jsonb_build_object('state','final','hg',f.home_goals,'ag',f.away_goals); end if;
 if f.lock is null then raise exception 'not_in_play'; end if;
 if p_home is null or p_away is null or p_home not between 0 and 30 or p_away not between 0 and 30 or p_digest is null or length(p_digest) not between 8 and 128 then raise exception 'invalid_result'; end if;
 if exists(select 1 from jsonb_array_elements(f.pens) e where not (e->>'done')::boolean) then raise exception 'penalty_open'; end if;
 insert into public.lg_results(fixture_id,owner_id,home_goals,away_goals,digest) values(p_fixture,auth.uid(),p_home,p_away,p_digest)
  on conflict (fixture_id,owner_id) do nothing;
 select * into mine from public.lg_results where fixture_id=p_fixture and owner_id=auth.uid();
 select * into his  from public.lg_results where fixture_id=p_fixture and owner_id<>auth.uid();
 if his.fixture_id is null then return jsonb_build_object('state','waiting'); end if;
 if his.home_goals=mine.home_goals and his.away_goals=mine.away_goals and his.digest=mine.digest then
  perform goalasso_private.lg_finalize(p_fixture,mine.home_goals,mine.away_goals);
  return jsonb_build_object('state','final','hg',mine.home_goals,'ag',mine.away_goals);
 end if;
 delete from public.lg_results where fixture_id=p_fixture;
 update public.lg_fixtures set seed=floor(random()*2147483000)::bigint, lock=null, pens='[]'::jsonb where id=p_fixture;
 return jsonb_build_object('state','conflict');
end $$;

-- The host ends the evening (or anybody does, two days after it began): a match one manager played stands as
-- he played it, and a match nobody opened is a goalless draw.
--
-- A match that was opened and never answered is neither. Once a fixture is locked its manager's phone knows how
-- it ends, so "open it, look, and leave it if it is a defeat" would turn every loss into a draw. Whoever locked a
-- match and sent no result has forfeited it 0:3 — which costs an honest manager nothing, because opening the
-- match again replays it in a moment and sends the result.
create or replace function goalasso_private.lg_round_close(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; f record; r public.lg_results; closed int:=0;
begin
 l:=goalasso_private.lg_member(p_league);
 if l.phase<>'season' then raise exception 'no_season'; end if;
 if l.host_id<>auth.uid() and coalesce(l.round_started,now())>now()-interval '48 hours' then raise exception 'host_only'; end if;
 for f in select * from public.lg_fixtures where league_id=p_league and season=l.season and round=l.round and played_at is null loop
  select * into r from public.lg_results where fixture_id=f.id order by at limit 1;
  if r.fixture_id is null and f.lock is not null and (f.lock->>'by')::uuid=f.home_id then perform goalasso_private.lg_finalize(f.id,0,3);
  elsif r.fixture_id is null and f.lock is not null and (f.lock->>'by')::uuid=f.away_id then perform goalasso_private.lg_finalize(f.id,3,0);
  elsif r.fixture_id is null then perform goalasso_private.lg_finalize(f.id,0,0);
  else perform goalasso_private.lg_finalize(f.id,r.home_goals,r.away_goals); end if;
  closed:=closed+1;
 end loop;
 return jsonb_build_object('closed',closed);
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- training
-- ---------------------------------------------------------------------------------------------------------
-- Three sessions a round, the same for everyone. Showing up gets all three; the skill is in whom they go to.
create or replace function goalasso_private.lg_train(p_league uuid, p_player text) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; used int;
begin
 l:=goalasso_private.lg_member(p_league);
 if l.phase<>'season' then raise exception 'no_season'; end if;
 if not exists(select 1 from public.lg_squads where league_id=p_league and player=p_player and owner_id=auth.uid()) then raise exception 'not_yours'; end if;
 select count(*) into used from public.lg_training where league_id=p_league and owner_id=auth.uid() and season=l.season and round=l.round;
 if used>=3 then raise exception 'no_sessions_left'; end if;
 insert into public.lg_training(league_id,owner_id,season,round,slot,player) values(p_league,auth.uid(),l.season,l.round,used+1,p_player);
 return jsonb_build_object('used',used+1,'total',(select count(*) from public.lg_training where league_id=p_league and player=p_player));
end $$;

create or replace function goalasso_private.lg_ground(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; g int; cost bigint; left_ bigint;
begin
 l:=goalasso_private.lg_member(p_league);
 select ground into g from public.lg_members where league_id=p_league and owner_id=auth.uid() for update;
 if g>=5 then raise exception 'ground_max'; end if;
 cost:=(array[1000000,2000000,4000000,7000000,12000000])[g+1];
 left_:=goalasso_private.lg_pay(p_league,auth.uid(),-cost,'training','ground '||(g+1));
 update public.lg_members set ground=g+1 where league_id=p_league and owner_id=auth.uid();
 return jsonb_build_object('ground',g+1,'charged',cost,'money',left_);
end $$;

revoke all on all functions in schema goalasso_private from public, anon;
grant execute on all functions in schema goalasso_private to authenticated;
-- The helpers that move money, squads or results are called only from the definer functions above, which run
-- as their owner. A signed-in manager has no business calling them, and PostgREST not exposing this schema is
-- one lock; this is the second.
revoke execute on function goalasso_private.lg_pay(uuid,uuid,bigint,text,text), goalasso_private.lg_fill(uuid,uuid,int,boolean),
 goalasso_private.lg_finalize(uuid,int,int), goalasso_private.lg_advance(uuid), goalasso_private.lg_make_fixtures(uuid,int) from authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- the public surface
-- ---------------------------------------------------------------------------------------------------------
create or replace function public.lg_prices(p_players text[]) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_prices(p_players)$$;
create or replace function public.lg_autofill(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_autofill(p_league)$$;
create or replace function public.lg_setup(p_league uuid, p_setup jsonb) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_setup(p_league,p_setup)$$;
create or replace function public.lg_start(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_start(p_league)$$;
create or replace function public.lg_next_season(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_next_season(p_league)$$;
create or replace function public.lg_fixture_lock(p_fixture uuid, p_sim text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_fixture_lock(p_fixture,p_sim)$$;
create or replace function public.lg_fixture_state(p_fixture uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_fixture_state(p_fixture)$$;
create or replace function public.lg_pen(p_fixture uuid, p_idx int, p_side text, p_dir text default null) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_pen(p_fixture,p_idx,p_side,p_dir)$$;
create or replace function public.lg_result(p_fixture uuid, p_home int, p_away int, p_digest text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_result(p_fixture,p_home,p_away,p_digest)$$;
create or replace function public.lg_round_close(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_round_close(p_league)$$;
create or replace function public.lg_train(p_league uuid, p_player text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_train(p_league,p_player)$$;
create or replace function public.lg_ground(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_ground(p_league)$$;
revoke all on function public.lg_prices(text[]), public.lg_autofill(uuid), public.lg_setup(uuid,jsonb), public.lg_start(uuid),
 public.lg_next_season(uuid), public.lg_fixture_lock(uuid,text), public.lg_fixture_state(uuid), public.lg_pen(uuid,int,text,text),
 public.lg_result(uuid,int,int,text), public.lg_round_close(uuid), public.lg_train(uuid,text), public.lg_ground(uuid) from public, anon;
grant execute on function public.lg_prices(text[]), public.lg_autofill(uuid), public.lg_setup(uuid,jsonb), public.lg_start(uuid),
 public.lg_next_season(uuid), public.lg_fixture_lock(uuid,text), public.lg_fixture_state(uuid), public.lg_pen(uuid,int,text,text),
 public.lg_result(uuid,int,int,text), public.lg_round_close(uuid), public.lg_train(uuid,text), public.lg_ground(uuid) to authenticated;

-- tell PostgREST to re-read the schema, so the new functions answer immediately
notify pgrst, 'reload schema';
