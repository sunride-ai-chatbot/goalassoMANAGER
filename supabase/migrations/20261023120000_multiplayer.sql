-- GOALASSO · multiplayer v1 (two human managers in one league). Paste into the Supabase SQL editor after the
-- single-player migration. Public anon/publishable key only; everything below is enforced by RLS and SECURITY DEFINER
-- functions, never by the client.
--
-- Model: the league state is one gzip+base64 JSON (the same career snapshot as a local save). The host's client is the
-- simulator: each week both members submit their management commands with mp_ready(); when both are ready (or the
-- host's timer has expired) the host applies the guest's commands, runs the week locally and commits the new state with
-- mp_commit(). Guests only read state and write their own member row. Realtime on both tables keeps the phones in sync.

create extension if not exists pgcrypto;

create table if not exists public.mp_leagues (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,                               -- 6-char invite code
  host_uid    uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'ליגה',
  status      text not null default 'lobby' check (status in ('lobby','play','done')),
  revision    int  not null default 0,
  week        int  not null default 0,
  season      int  not null default 1,
  turn_min    int  not null default 1440,                          -- minutes each member has to press "ready"
  turn_due    timestamptz,                                          -- when the current turn's timer expires
  state_gz    text,                                                 -- gzip(JSON state) base64, written by the host
  state_bytes int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists public.mp_members (
  league_id   uuid not null references public.mp_leagues(id) on delete cascade,
  uid         uuid not null references auth.users(id) on delete cascade,
  club_id     text not null,
  display_name text not null default 'מנג''ר',
  is_host     boolean not null default false,
  ready_rev   int  not null default -1,                            -- revision the member is ready for
  commands    jsonb not null default '{}'::jsonb,                  -- lineup/formation/tactics for the next week
  last_seen   timestamptz not null default now(),
  joined_at   timestamptz not null default now(),
  primary key (league_id, uid),
  unique (league_id, club_id)
);
create index if not exists mp_members_uid on public.mp_members(uid);

alter table public.mp_leagues enable row level security;
alter table public.mp_members enable row level security;

-- members (and only members) see their league and its member rows
create policy "members read league" on public.mp_leagues for select
  using (exists (select 1 from public.mp_members m where m.league_id = id and m.uid = auth.uid()));
create policy "members read members" on public.mp_members for select
  using (exists (select 1 from public.mp_members m where m.league_id = mp_members.league_id and m.uid = auth.uid()));
create policy "member updates own row" on public.mp_members for update
  using (uid = auth.uid()) with check (uid = auth.uid() and is_host = (select is_host from public.mp_members x where x.league_id = mp_members.league_id and x.uid = auth.uid()));
-- inserts/state commits go through the functions below

create or replace function public.mp_gen_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random()*32)+1)::int, 1), '') from generate_series(1,6);
$$;

-- host creates a league with his club and the initial state
create or replace function public.mp_create_league(p_name text, p_club text, p_display text, p_state_gz text, p_turn_min int default 1440)
returns table (league_id uuid, code text) language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    v_code := mp_gen_code();
    exit when not exists (select 1 from mp_leagues l where l.code = v_code);
  end loop;
  insert into mp_leagues (code, host_uid, name, state_gz, state_bytes, turn_min)
    values (v_code, auth.uid(), coalesce(nullif(p_name,''),'ליגה'), p_state_gz, length(coalesce(p_state_gz,'')), greatest(5, coalesce(p_turn_min,1440)))
    returning id into v_id;
  insert into mp_members (league_id, uid, club_id, display_name, is_host) values (v_id, auth.uid(), p_club, coalesce(nullif(p_display,''),'מנג''ר'), true);
  return query select v_id, v_code;
end $$;

-- guest joins by invite code, picking a club that is not taken; a member re-joining gets his existing row
create or replace function public.mp_join(p_code text, p_club text, p_display text)
returns table (league_id uuid, club_id text, is_host boolean, status text) language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_status text; v_n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select l.id, l.status into v_id, v_status from mp_leagues l where l.code = upper(trim(p_code));
  if v_id is null then raise exception 'league not found'; end if;
  if exists (select 1 from mp_members m where m.league_id = v_id and m.uid = auth.uid()) then
    return query select m.league_id, m.club_id, m.is_host, v_status from mp_members m where m.league_id = v_id and m.uid = auth.uid(); return;
  end if;
  if v_status <> 'lobby' then raise exception 'league already started'; end if;
  select count(*) into v_n from mp_members m where m.league_id = v_id;
  if v_n >= 2 then raise exception 'league is full'; end if;
  if exists (select 1 from mp_members m where m.league_id = v_id and m.club_id = p_club) then raise exception 'club taken'; end if;
  insert into mp_members (league_id, uid, club_id, display_name) values (v_id, auth.uid(), p_club, coalesce(nullif(p_display,''),'מנג''ר'));
  update mp_leagues set updated_at = now() where id = v_id;
  return query select v_id, p_club, false, v_status;
end $$;

-- host starts the league once two members are in (sets status, the first turn timer)
create or replace function public.mp_start(p_league uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_turn int;
begin
  if not exists (select 1 from mp_leagues l where l.id = p_league and l.host_uid = auth.uid()) then raise exception 'host only'; end if;
  if (select count(*) from mp_members m where m.league_id = p_league) < 2 then raise exception 'need two managers'; end if;
  select turn_min into v_turn from mp_leagues where id = p_league;
  update mp_leagues set status = 'play', turn_due = now() + make_interval(mins => v_turn), updated_at = now() where id = p_league;
end $$;

-- a member is ready for the week at revision p_rev with his commands
create or replace function public.mp_ready(p_league uuid, p_rev int, p_commands jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  update mp_members set ready_rev = p_rev, commands = coalesce(p_commands,'{}'::jsonb), last_seen = now()
    where league_id = p_league and uid = auth.uid();
  if not found then raise exception 'not a member'; end if;
  update mp_leagues set updated_at = now() where id = p_league;
end $$;

-- the host commits the simulated week: optimistic revision check, resets readiness, starts the next timer
create or replace function public.mp_commit(p_league uuid, p_from_rev int, p_state_gz text, p_week int, p_season int, p_done boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare v_turn int; v_rev int;
begin
  select turn_min, revision into v_turn, v_rev from mp_leagues where id = p_league and host_uid = auth.uid() for update;
  if v_rev is null then raise exception 'host only'; end if;
  if v_rev <> p_from_rev then raise exception 'stale revision %, league is at %', p_from_rev, v_rev; end if;
  update mp_leagues set revision = v_rev + 1, state_gz = p_state_gz, state_bytes = length(coalesce(p_state_gz,'')), week = p_week, season = p_season,
    status = case when p_done then 'done' else status end, turn_due = now() + make_interval(mins => v_turn), updated_at = now()
    where id = p_league;
  return v_rev + 1;
end $$;

-- heartbeat for presence ("X התנתק")
create or replace function public.mp_seen(p_league uuid) returns void language sql security definer set search_path = public as $$
  update public.mp_members set last_seen = now() where league_id = p_league and uid = auth.uid();
$$;

grant execute on function public.mp_create_league(text,text,text,text,int), public.mp_join(text,text,text), public.mp_start(uuid),
  public.mp_ready(uuid,int,jsonb), public.mp_commit(uuid,int,text,int,int,boolean), public.mp_seen(uuid) to authenticated, anon;

-- realtime: both phones get a push when the league or a member row changes
do $$ begin
  begin alter publication supabase_realtime add table public.mp_leagues; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.mp_members; exception when duplicate_object then null; end;
end $$;
