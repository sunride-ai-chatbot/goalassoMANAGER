-- Shared league, step 1 of docs/shared-league.md: the server owns the money and the squads.
--
-- The rule this whole file exists for: in a friendly, the phone that simulates owns nothing worth stealing.
-- The moment there is a budget, a squad and a table, a console on that phone is enough to grant yourself ten
-- million or buy a striker for nothing. So every number that can be cheated lives here, behind definer
-- functions that check auth.uid(), on tables with RLS enabled and no privileges granted to anybody — the same
-- shape as 20261024000000_rooms.sql, tested the same way on PGlite (tests/sql/league-base.sql).
--
-- A price the client sends is not a price. public.lg_pool is the one list of what a player costs in a league,
-- seeded from the game's own data (scripts/build-league-pool.py -> supabase/seed-league-pool.sql); lg_buy reads
-- it and ignores whatever the caller believes. Without the seed nothing can be bought, which is the safe way
-- round: an empty pool sells nothing, it does not sell everything for free.
create schema if not exists goalasso_private;
revoke all on schema goalasso_private from public, anon;
grant usage on schema goalasso_private to authenticated;

create table public.lg_leagues (
 id uuid primary key default gen_random_uuid(),
 invitation uuid not null unique default gen_random_uuid(),
 host_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 60),
 capacity int not null default 4 check (capacity between 2 and 8),
 budget bigint not null default 60000000 check (budget between 1000000 and 1000000000),
 season int not null default 1 check (season between 1 and 99),
 round int not null default 0 check (round between 0 and 99),
 phase text not null default 'build' check (phase in ('build','season','done')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '180 days'
);
create index lg_leagues_host on public.lg_leagues(host_id);

create table public.lg_members (
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 team text not null check (length(team) between 1 and 40),
 crest jsonb not null default '{"tier":"free"}'::jsonb,
 kit jsonb not null default '{"tier":"plain"}'::jsonb,
 money bigint not null check (money >= 0),
 joined_at timestamptz not null default now(),
 last_seen timestamptz not null default now(),
 primary key (league_id, owner_id),
 unique (league_id, team)
);

-- One pool per league: a player belongs to exactly one manager in it, which the primary key is.
create table public.lg_squads (
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 player text not null check (length(player) between 1 and 80),
 owner_id uuid not null,
 paid bigint not null check (paid >= 0),
 bought_at timestamptz not null default now(),
 primary key (league_id, player),
 foreign key (league_id, owner_id) references public.lg_members(league_id, owner_id) on delete cascade
);
create index lg_squads_owner on public.lg_squads(league_id, owner_id);

-- Every change of money has a reason and stays readable: a league that argues about a number can be settled.
create table public.lg_ledger (
 id bigserial primary key,
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 amount bigint not null,
 reason text not null check (reason in ('start','buy','sell','trade','result','prize','kit','crest','training')),
 note text check (note is null or length(note) <= 120),
 at timestamptz not null default now()
);
create index lg_ledger_member on public.lg_ledger(league_id, owner_id, id);

create table public.lg_fixtures (
 id uuid primary key default gen_random_uuid(),
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 season int not null,
 round int not null,
 home_id uuid not null,
 away_id uuid not null check (away_id <> home_id),
 seed bigint not null,
 home_goals int check (home_goals between 0 and 30),
 away_goals int check (away_goals between 0 and 30),
 played_at timestamptz,
 unique (league_id, season, round, home_id)
);
create index lg_fixtures_round on public.lg_fixtures(league_id, season, round);

-- Step 4 of the plan: both phones run the engine over the server's seed and submit what they got; the result
-- counts only when the two agree. One row per manager, so neither can overwrite the other's answer.
create table public.lg_results (
 fixture_id uuid not null references public.lg_fixtures(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 home_goals int not null check (home_goals between 0 and 30),
 away_goals int not null check (away_goals between 0 and 30),
 digest text not null check (length(digest) between 8 and 128),
 at timestamptz not null default now(),
 primary key (fixture_id, owner_id)
);

create table public.lg_offers (
 id uuid primary key default gen_random_uuid(),
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 from_id uuid not null,
 to_id uuid not null check (to_id <> from_id),
 give text[] not null default '{}',
 want text[] not null default '{}',
 cash bigint not null default 0,
 state text not null default 'open' check (state in ('open','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),
 foreign key (league_id, from_id) references public.lg_members(league_id, owner_id) on delete cascade,
 foreign key (league_id, to_id) references public.lg_members(league_id, owner_id) on delete cascade
);
create index lg_offers_inbox on public.lg_offers(league_id, to_id, state);

create table public.lg_training (
 league_id uuid not null references public.lg_leagues(id) on delete cascade,
 owner_id uuid not null,
 season int not null,
 round int not null,
 slot int not null check (slot between 1 and 3),
 player text not null,
 at timestamptz not null default now(),
 primary key (league_id, owner_id, season, round, slot),
 foreign key (league_id, owner_id) references public.lg_members(league_id, owner_id) on delete cascade
);

-- The price list. Seeded by the owner from the game's data; nothing here is written by a player.
create table public.lg_pool (
 player text primary key check (length(player) between 1 and 80),
 name text not null,
 pos text,
 age int check (age between 14 and 60),
 value bigint not null check (value > 0)
);

alter table public.lg_leagues  enable row level security;
alter table public.lg_members  enable row level security;
alter table public.lg_squads   enable row level security;
alter table public.lg_ledger   enable row level security;
alter table public.lg_fixtures enable row level security;
alter table public.lg_results  enable row level security;
alter table public.lg_offers   enable row level security;
alter table public.lg_training enable row level security;
alter table public.lg_pool     enable row level security;
revoke all on public.lg_leagues, public.lg_members, public.lg_squads, public.lg_ledger,
 public.lg_fixtures, public.lg_results, public.lg_offers, public.lg_training, public.lg_pool
 from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------------------------------------
create function goalasso_private.lg_pay(p_league uuid, p_owner uuid, p_amount bigint, p_reason text, p_note text)
returns bigint language plpgsql security definer set search_path='' as $$
declare left_ bigint;
begin
 update public.lg_members set money=money+p_amount where league_id=p_league and owner_id=p_owner returning money into left_;
 if left_ is null then raise exception 'not_a_member'; end if;
 insert into public.lg_ledger(league_id,owner_id,amount,reason,note) values(p_league,p_owner,p_amount,p_reason,p_note);
 return left_;
exception when check_violation then raise exception 'no_money';
end $$;

-- What a squad is allowed to be: at most 22 always, at least 14 once the season has started. During the build
-- phase a squad is free to be small, because it is being assembled.
create function goalasso_private.lg_squad_size(p_league uuid, p_owner uuid) returns int language sql stable security definer set search_path='' as $$
 select count(*)::int from public.lg_squads where league_id=p_league and owner_id=p_owner
$$;

create function goalasso_private.lg_crest_cost(p jsonb) returns bigint language sql immutable set search_path='' as $$
 select case coalesce(p->>'tier','free') when 'free' then 0::bigint when 'custom' then 1000000::bigint when 'premium' then 2000000::bigint else null end
$$;
create function goalasso_private.lg_kit_cost(p jsonb) returns bigint language sql immutable set search_path='' as $$
 select case coalesce(p->>'tier','plain') when 'plain' then 0::bigint when 'pattern' then 500000::bigint when 'premium' then 2000000::bigint else null end
$$;

-- ---------------------------------------------------------------------------------------------------------
-- lobby
-- ---------------------------------------------------------------------------------------------------------
create function goalasso_private.lg_create(p_name text, p_team text, p_capacity int) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 if p_name is null or length(btrim(p_name)) not between 1 and 60 then raise exception 'invalid_name'; end if;
 if p_team is null or length(btrim(p_team)) not between 1 and 40 then raise exception 'invalid_team'; end if;
 if p_capacity is null or p_capacity not between 2 and 8 then raise exception 'invalid_capacity'; end if;
 delete from public.lg_leagues where host_id=auth.uid() and expires_at<=now();
 if (select count(*) from public.lg_leagues where host_id=auth.uid())>=10 then raise exception 'too_many_leagues'; end if;
 insert into public.lg_leagues(host_id,name,capacity) values(auth.uid(),btrim(p_name),p_capacity) returning * into l;
 insert into public.lg_members(league_id,owner_id,team,money) values(l.id,auth.uid(),btrim(p_team),l.budget);
 insert into public.lg_ledger(league_id,owner_id,amount,reason) values(l.id,auth.uid(),l.budget,'start');
 return jsonb_build_object('id',l.id,'invitation',l.invitation);
end $$;

create function goalasso_private.lg_join(p_invitation uuid, p_team text) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; m public.lg_members;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 if p_team is null or length(btrim(p_team)) not between 1 and 40 then raise exception 'invalid_team'; end if;
 select * into l from public.lg_leagues where invitation=p_invitation and expires_at>now() for update;
 if l.id is null then raise exception 'invitation_expired'; end if;
 select * into m from public.lg_members where league_id=l.id and owner_id=auth.uid();
 if m.league_id is not null then return jsonb_build_object('id',l.id,'invitation',l.invitation); end if;
 if l.phase<>'build' then raise exception 'league_started'; end if;
 if exists(select 1 from public.lg_members where league_id=l.id and team=btrim(p_team)) then raise exception 'team_taken'; end if;
 if (select count(*) from public.lg_members where league_id=l.id)>=l.capacity then raise exception 'league_full'; end if;
 insert into public.lg_members(league_id,owner_id,team,money) values(l.id,auth.uid(),btrim(p_team),l.budget);
 insert into public.lg_ledger(league_id,owner_id,amount,reason) values(l.id,auth.uid(),l.budget,'start');
 return jsonb_build_object('id',l.id,'invitation',l.invitation);
end $$;

-- A member sees the whole league: every budget and every squad, because friends arguing over a transfer need
-- to see the same board. Nothing outside the league sees anything.
create function goalasso_private.lg_get(p_league uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into l from public.lg_leagues where id=p_league and expires_at>now();
 if l.id is null or not exists(select 1 from public.lg_members where league_id=p_league and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 update public.lg_members set last_seen=now() where league_id=p_league and owner_id=auth.uid();
 return jsonb_build_object(
  'id',l.id,'name',l.name,'invitation',case when l.host_id=auth.uid() then l.invitation else null end,
  'host',l.host_id=auth.uid(),'capacity',l.capacity,'budget',l.budget,'season',l.season,'round',l.round,'phase',l.phase,
  'members',(select coalesce(jsonb_agg(jsonb_build_object(
     'mine',m.owner_id=auth.uid(),'host',m.owner_id=l.host_id,'team',m.team,'crest',m.crest,'kit',m.kit,
     'money',m.money,'squad',goalasso_private.lg_squad_size(p_league,m.owner_id),'seen',m.last_seen)
    order by m.joined_at),'[]'::jsonb) from public.lg_members m where m.league_id=p_league),
  'squad',(select coalesce(jsonb_agg(jsonb_build_object('player',s.player,'paid',s.paid) order by s.bought_at),'[]'::jsonb)
    from public.lg_squads s where s.league_id=p_league and s.owner_id=auth.uid()),
  'taken',(select coalesce(jsonb_agg(s.player),'[]'::jsonb) from public.lg_squads s where s.league_id=p_league));
end $$;

create function goalasso_private.lg_set_identity(p_league uuid, p_team text, p_crest jsonb, p_kit jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.lg_members; add bigint:=0; c_old bigint; c_new bigint; k_old bigint; k_new bigint;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into m from public.lg_members where league_id=p_league and owner_id=auth.uid() for update;
 if m.league_id is null then raise exception 'not_a_member'; end if;
 if p_team is not null then
  if length(btrim(p_team)) not between 1 and 40 then raise exception 'invalid_team'; end if;
  if exists(select 1 from public.lg_members where league_id=p_league and team=btrim(p_team) and owner_id<>auth.uid()) then raise exception 'team_taken'; end if;
 end if;
 if p_crest is not null then
  if jsonb_typeof(p_crest)<>'object' or octet_length(p_crest::text)>4000 then raise exception 'invalid_crest'; end if;
  c_old:=goalasso_private.lg_crest_cost(m.crest); c_new:=goalasso_private.lg_crest_cost(p_crest);
  if c_new is null then raise exception 'invalid_crest'; end if;
  -- only the step up is charged, and a step down is never refunded: a tier is bought once
  if c_new>c_old then add:=add+(c_new-c_old); end if;
 end if;
 if p_kit is not null then
  if jsonb_typeof(p_kit)<>'object' or octet_length(p_kit::text)>4000 then raise exception 'invalid_kit'; end if;
  k_old:=goalasso_private.lg_kit_cost(m.kit); k_new:=goalasso_private.lg_kit_cost(p_kit);
  if k_new is null then raise exception 'invalid_kit'; end if;
  if k_new>k_old then add:=add+(k_new-k_old); end if;
 end if;
 if add>0 then perform goalasso_private.lg_pay(p_league,auth.uid(),-add,case when p_crest is not null and (c_new>c_old) then 'crest' else 'kit' end,null); end if;
 update public.lg_members set team=coalesce(btrim(p_team),team), crest=coalesce(p_crest,crest), kit=coalesce(p_kit,kit)
  where league_id=p_league and owner_id=auth.uid() returning * into m;
 return jsonb_build_object('team',m.team,'crest',m.crest,'kit',m.kit,'money',m.money,'charged',add);
end $$;

-- ---------------------------------------------------------------------------------------------------------
-- the market
-- ---------------------------------------------------------------------------------------------------------
create function goalasso_private.lg_buy(p_league uuid, p_player text) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; price bigint; left_ bigint;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into l from public.lg_leagues where id=p_league for update;
 if l.id is null or not exists(select 1 from public.lg_members where league_id=p_league and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 select value into price from public.lg_pool where player=p_player;
 if price is null then raise exception 'unknown_player'; end if;
 if exists(select 1 from public.lg_squads where league_id=p_league and player=p_player) then raise exception 'player_taken'; end if;
 if goalasso_private.lg_squad_size(p_league,auth.uid())>=22 then raise exception 'squad_full'; end if;
 left_:=goalasso_private.lg_pay(p_league,auth.uid(),-price,'buy',p_player);
 insert into public.lg_squads(league_id,player,owner_id,paid) values(p_league,p_player,auth.uid(),price);
 return jsonb_build_object('player',p_player,'paid',price,'money',left_);
end $$;

-- Selling back to the pool is always at a discount; at par it is a money printer, because a squad could be
-- churned to no effect and a trade could be laundered through the pool.
create function goalasso_private.lg_sell(p_league uuid, p_player text) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.lg_leagues; price bigint; back bigint; left_ bigint;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into l from public.lg_leagues where id=p_league for update;
 if l.id is null then raise exception 'not_a_member'; end if;
 if not exists(select 1 from public.lg_squads where league_id=p_league and player=p_player and owner_id=auth.uid()) then raise exception 'not_yours'; end if;
 if l.phase<>'build' and goalasso_private.lg_squad_size(p_league,auth.uid())<=14 then raise exception 'squad_too_small'; end if;
 select value into price from public.lg_pool where player=p_player;
 back:=((coalesce(price,0)*70)/100)::bigint;
 delete from public.lg_squads where league_id=p_league and player=p_player;
 left_:=goalasso_private.lg_pay(p_league,auth.uid(),back,'sell',p_player);
 return jsonb_build_object('player',p_player,'back',back,'money',left_);
end $$;

create function goalasso_private.lg_offer(p_league uuid, p_to uuid, p_give text[], p_want text[], p_cash bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.lg_offers;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 if not exists(select 1 from public.lg_members where league_id=p_league and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 if p_to is null or p_to=auth.uid() or not exists(select 1 from public.lg_members where league_id=p_league and owner_id=p_to) then raise exception 'no_such_manager'; end if;
 p_give:=coalesce(p_give,'{}'); p_want:=coalesce(p_want,'{}'); p_cash:=coalesce(p_cash,0);
 if array_length(p_give,1) is null and array_length(p_want,1) is null and p_cash=0 then raise exception 'empty_offer'; end if;
 if coalesce(array_length(p_give,1),0)>8 or coalesce(array_length(p_want,1),0)>8 then raise exception 'offer_too_big'; end if;
 if exists(select 1 from unnest(p_give) g where not exists(select 1 from public.lg_squads where league_id=p_league and player=g and owner_id=auth.uid())) then raise exception 'not_yours'; end if;
 if exists(select 1 from unnest(p_want) w where not exists(select 1 from public.lg_squads where league_id=p_league and player=w and owner_id=p_to)) then raise exception 'not_his'; end if;
 insert into public.lg_offers(league_id,from_id,to_id,give,want,cash) values(p_league,auth.uid(),p_to,p_give,p_want,p_cash) returning * into o;
 return jsonb_build_object('id',o.id);
end $$;

-- Both sides move together or neither does: the whole body is one transaction, and every check that could
-- fail — ownership, both budgets, both squad sizes — runs before the first row changes hands.
create function goalasso_private.lg_respond(p_offer uuid, p_accept boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.lg_offers; l public.lg_leagues; n_from int; n_to int;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 select * into o from public.lg_offers where id=p_offer for update;
 if o.id is null or o.state<>'open' then raise exception 'no_such_offer'; end if;
 if auth.uid()=o.from_id and not p_accept then
  update public.lg_offers set state='cancelled' where id=p_offer; return jsonb_build_object('state','cancelled');
 end if;
 if auth.uid()<>o.to_id then raise exception 'not_yours'; end if;
 if not p_accept then update public.lg_offers set state='declined' where id=p_offer; return jsonb_build_object('state','declined'); end if;
 select * into l from public.lg_leagues where id=o.league_id for update;
 if exists(select 1 from unnest(o.give) g where not exists(select 1 from public.lg_squads where league_id=o.league_id and player=g and owner_id=o.from_id))
 or exists(select 1 from unnest(o.want) w where not exists(select 1 from public.lg_squads where league_id=o.league_id and player=w and owner_id=o.to_id)) then
  update public.lg_offers set state='cancelled' where id=p_offer; raise exception 'offer_stale';
 end if;
 n_from:=goalasso_private.lg_squad_size(o.league_id,o.from_id)-coalesce(array_length(o.give,1),0)+coalesce(array_length(o.want,1),0);
 n_to  :=goalasso_private.lg_squad_size(o.league_id,o.to_id)  -coalesce(array_length(o.want,1),0)+coalesce(array_length(o.give,1),0);
 if n_from>22 or n_to>22 then raise exception 'squad_full'; end if;
 if l.phase<>'build' and (n_from<14 or n_to<14) then raise exception 'squad_too_small'; end if;
 update public.lg_squads set owner_id=o.to_id   where league_id=o.league_id and player=any(o.give);
 update public.lg_squads set owner_id=o.from_id where league_id=o.league_id and player=any(o.want);
 if o.cash<>0 then
  perform goalasso_private.lg_pay(o.league_id,o.from_id,-o.cash,'trade',null);
  perform goalasso_private.lg_pay(o.league_id,o.to_id,   o.cash,'trade',null);
 end if;
 update public.lg_offers set state='accepted' where id=p_offer;
 return jsonb_build_object('state','accepted');
end $$;

revoke all on all functions in schema goalasso_private from public, anon;
grant execute on all functions in schema goalasso_private to authenticated;

-- ---------------------------------------------------------------------------------------------------------
-- the public surface: thin invoker wrappers, exactly as the room service does it
-- ---------------------------------------------------------------------------------------------------------
create function public.lg_create(p_name text, p_team text, p_capacity int default 4) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_create(p_name,p_team,p_capacity)$$;
create function public.lg_join(p_invitation uuid, p_team text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_join(p_invitation,p_team)$$;
create function public.lg_get(p_league uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_get(p_league)$$;
create function public.lg_set_identity(p_league uuid, p_team text default null, p_crest jsonb default null, p_kit jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_set_identity(p_league,p_team,p_crest,p_kit)$$;
create function public.lg_buy(p_league uuid, p_player text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_buy(p_league,p_player)$$;
create function public.lg_sell(p_league uuid, p_player text) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_sell(p_league,p_player)$$;
create function public.lg_offer(p_league uuid, p_to uuid, p_give text[], p_want text[], p_cash bigint default 0) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_offer(p_league,p_to,p_give,p_want,p_cash)$$;
create function public.lg_respond(p_offer uuid, p_accept boolean) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.lg_respond(p_offer,p_accept)$$;
revoke all on function public.lg_create(text,text,int), public.lg_join(uuid,text), public.lg_get(uuid),
 public.lg_set_identity(uuid,text,jsonb,jsonb), public.lg_buy(uuid,text), public.lg_sell(uuid,text),
 public.lg_offer(uuid,uuid,text[],text[],bigint), public.lg_respond(uuid,boolean) from public, anon;
grant execute on function public.lg_create(text,text,int), public.lg_join(uuid,text), public.lg_get(uuid),
 public.lg_set_identity(uuid,text,jsonb,jsonb), public.lg_buy(uuid,text), public.lg_sell(uuid,text),
 public.lg_offer(uuid,uuid,text[],text[],bigint), public.lg_respond(uuid,boolean) to authenticated;

-- The invitation card is shown before anybody signs in. It says who is inviting and whether there is room —
-- the league's name, the host's team, how many are in. The invitation id is the secret; it is the only key.
create function public.lg_preview_invitation(p_invitation uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare l public.lg_leagues;
begin
 select * into l from public.lg_leagues where invitation=p_invitation and expires_at>now();
 if l.id is null then raise exception 'invitation_expired'; end if;
 return jsonb_build_object('league',l.name,
  'team',(select team from public.lg_members where league_id=l.id and owner_id=l.host_id),
  'members',(select count(*) from public.lg_members where league_id=l.id),
  'capacity',l.capacity,
  'full',(select count(*) from public.lg_members where league_id=l.id)>=l.capacity or l.phase<>'build');
end $$;
revoke all on function public.lg_preview_invitation(uuid) from public;
grant execute on function public.lg_preview_invitation(uuid) to anon, authenticated;
