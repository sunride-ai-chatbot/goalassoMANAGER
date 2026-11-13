-- GOALASSO network play: everything a fresh Supabase project needs for "משחק רשת · הזמן חבר".
-- Paste the whole file into the SQL Editor of the project and press Run, once. It is the two migrations
-- supabase/migrations/20261024000000_rooms.sql and 20261024055611_room_friendlies.sql, in order.
-- Invitation rooms: the base service that 20261024055611_room_friendlies.sql extends.
-- The first deployment had these objects only in its database; this file restores them for a fresh project.
-- Do not apply 20261023120000_multiplayer.sql (the historical league schema) to the same project: both define
-- public.mp_members.
create schema if not exists goalasso_private;
revoke all on schema goalasso_private from public, anon;
grant usage on schema goalasso_private to authenticated;

create table public.mp_rooms (
 id uuid primary key default gen_random_uuid(),
 invitation uuid not null unique default gen_random_uuid(),
 host_id uuid not null references auth.users(id) on delete cascade,
 capacity int not null default 2 check (capacity between 2 and 8),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now() + interval '7 days'
);
create index mp_rooms_host on public.mp_rooms(host_id);
create table public.mp_members (
 room_id uuid not null references public.mp_rooms(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 career_id text not null,
 club text not null,
 snapshot jsonb not null,
 joined_at timestamptz not null default now(),
 primary key (room_id, owner_id),
 unique (room_id, club)
);
alter table public.mp_rooms enable row level security;
alter table public.mp_members enable row level security;
revoke all on public.mp_rooms, public.mp_members from public, anon, authenticated;

-- A squad snapshot as the client sends it: {careerId, season, round, club:{name, players:[…], …}}
create function goalasso_private.validate_snapshot(p jsonb) returns void language plpgsql immutable set search_path='' as $$
begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>1500000
 or coalesce(length(p->>'careerId'),0) not between 1 and 100
 or jsonb_typeof(p->'club') is distinct from 'object'
 or coalesce(length(p->'club'->>'name'),0) not between 1 and 100
 or jsonb_typeof(p->'club'->'players') is distinct from 'array'
 or jsonb_array_length(p->'club'->'players') not between 11 and 80 then raise exception 'invalid_snapshot'; end if;
end $$;

create function goalasso_private.create_room(p_snapshot jsonb, p_capacity int) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.mp_rooms;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 perform goalasso_private.validate_snapshot(p_snapshot);
 if p_capacity is null or p_capacity not between 2 and 8 then raise exception 'invalid_capacity'; end if;
 delete from public.mp_rooms where host_id=auth.uid() and expires_at<=now();
 if (select count(*) from public.mp_rooms where host_id=auth.uid())>=20 then raise exception 'too_many_rooms'; end if;
 insert into public.mp_rooms(host_id,capacity) values(auth.uid(),p_capacity) returning * into r;
 insert into public.mp_members(room_id,owner_id,career_id,club,snapshot) values(r.id,auth.uid(),p_snapshot->>'careerId',p_snapshot->'club'->>'name',p_snapshot);
 return jsonb_build_object('id',r.id,'invitation',r.invitation);
end $$;

create function goalasso_private.join_room(p_invitation uuid, p_snapshot jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.mp_rooms; m public.mp_members;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 perform goalasso_private.validate_snapshot(p_snapshot);
 select * into r from public.mp_rooms where invitation=p_invitation and expires_at>now() for update;
 if r.id is null then raise exception 'invitation_expired'; end if;
 select * into m from public.mp_members where room_id=r.id and owner_id=auth.uid();
 if m.room_id is not null then
  -- already in the room: the squad stays as it was when he joined
  if m.career_id is distinct from p_snapshot->>'careerId' then raise exception 'different_career'; end if;
  return jsonb_build_object('id',r.id,'invitation',r.invitation);
 end if;
 if exists(select 1 from public.mp_members where room_id=r.id and club=p_snapshot->'club'->>'name') then raise exception 'club_taken'; end if;
 if (select count(*) from public.mp_members where room_id=r.id)>=r.capacity then raise exception 'room_full'; end if;
 insert into public.mp_members(room_id,owner_id,career_id,club,snapshot) values(r.id,auth.uid(),p_snapshot->>'careerId',p_snapshot->'club'->>'name',p_snapshot);
 return jsonb_build_object('id',r.id,'invitation',r.invitation);
end $$;

create function goalasso_private.get_room(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.mp_rooms;
begin
 select * into r from public.mp_rooms where id=p_room and expires_at>now();
 if auth.uid() is null or r.id is null or not exists(select 1 from public.mp_members where room_id=p_room and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 return jsonb_build_object('id',r.id,'invitation',r.invitation,'host',r.host_id=auth.uid(),'capacity',r.capacity,'expires_at',r.expires_at,
  'members',(select jsonb_agg(jsonb_build_object('mine',m.owner_id=auth.uid(),'host',m.owner_id=r.host_id,'club',m.club) order by m.owner_id=r.host_id desc,m.joined_at) from public.mp_members m where m.room_id=p_room));
end $$;

revoke all on all functions in schema goalasso_private from public, anon;
grant execute on all functions in schema goalasso_private to authenticated;

create function public.mp_validate_snapshot(p_snapshot jsonb) returns boolean language plpgsql security invoker set search_path='' as $$begin perform goalasso_private.validate_snapshot(p_snapshot); return true; end $$;
create function public.mp_create_room(p_snapshot jsonb, p_capacity int default 2) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.create_room(p_snapshot,p_capacity)$$;
create function public.mp_join_room(p_invitation uuid, p_snapshot jsonb) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.join_room(p_invitation,p_snapshot)$$;
create function public.mp_get_room(p_room uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.get_room(p_room)$$;
revoke all on function public.mp_validate_snapshot(jsonb), public.mp_create_room(jsonb,int), public.mp_join_room(uuid,jsonb), public.mp_get_room(uuid) from public, anon;
grant execute on function public.mp_validate_snapshot(jsonb), public.mp_create_room(jsonb,int), public.mp_join_room(uuid,jsonb), public.mp_get_room(uuid) to authenticated;

-- The invitation dialog shows who invites before anybody signs in: the inviting club's name and whether the room is
-- full, nothing else. The invitation id is the secret; it is the only way to ask.
create function public.mp_preview_invitation(p_invitation uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.mp_rooms;
begin
 select * into r from public.mp_rooms where invitation=p_invitation and expires_at>now();
 if r.id is null then raise exception 'invitation_expired'; end if;
 return jsonb_build_object('club',(select club from public.mp_members where room_id=r.id and owner_id=r.host_id),
  'full',(select count(*) from public.mp_members where room_id=r.id)>=r.capacity);
end $$;
revoke all on function public.mp_preview_invitation(uuid) from public;
grant execute on function public.mp_preview_invitation(uuid) to anon, authenticated;

-- Extend existing invitation rooms without replacing their schema or careers.
create schema if not exists goalasso_private;
revoke all on schema goalasso_private from public, anon;
grant usage on schema goalasso_private to authenticated;
create table public.mp_friendlies (
 room_id uuid primary key references public.mp_rooms(id) on delete cascade,
 ready uuid[] not null default '{}', result jsonb, created_at timestamptz not null default now()
);
alter table public.mp_friendlies enable row level security;
revoke all on public.mp_friendlies from public, anon, authenticated;

create function goalasso_private.friendly_state(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.mp_rooms; f public.mp_friendlies;
begin
 select * into r from public.mp_rooms where id=p_room and expires_at>now();
 if auth.uid() is null or r.id is null or not exists(select 1 from public.mp_members where room_id=p_room and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 select * into f from public.mp_friendlies where room_id=p_room;
 return jsonb_build_object('host',r.host_id=auth.uid(),'result',f.result,'members',(select jsonb_agg(jsonb_build_object('mine',m.owner_id=auth.uid(),'ready',m.owner_id=any(coalesce(f.ready,'{}'::uuid[])),'snapshot',m.snapshot) order by m.owner_id=r.host_id desc,m.owner_id) from public.mp_members m where m.room_id=p_room));
end $$;
create function goalasso_private.friendly_ready(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform goalasso_private.friendly_state(p_room);
 if (select capacity from public.mp_rooms where id=p_room)<>2 then raise exception 'friendly_requires_two'; end if;
 insert into public.mp_friendlies(room_id,ready) values(p_room,array[auth.uid()])
 on conflict(room_id) do update set ready=case when auth.uid()=any(public.mp_friendlies.ready) then public.mp_friendlies.ready else array_append(public.mp_friendlies.ready,auth.uid()) end;
 return goalasso_private.friendly_state(p_room);
end $$;
create function goalasso_private.friendly_commit(p_room uuid,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.mp_friendlies;
begin
 perform goalasso_private.friendly_state(p_room);
 if (select host_id from public.mp_rooms where id=p_room) is distinct from auth.uid() then raise exception 'host_only'; end if;
 select * into f from public.mp_friendlies where room_id=p_room for update;
 if f.room_id is null or cardinality(f.ready)<>2 or (select count(*) from public.mp_members where room_id=p_room)<>2 then raise exception 'not_ready'; end if;
 if f.result is not null then return f.result; end if;
 if p_result is null or jsonb_typeof(p_result)<>'object' or octet_length(p_result::text)>500000
 or jsonb_typeof(p_result->'events') is distinct from 'array'
 or coalesce(p_result->>'minutes','')<>'90'
 or coalesce(p_result->>'gh','')!~ '^[0-9]{1,2}$' or coalesce(p_result->>'ga','')!~ '^[0-9]{1,2}$'
 or coalesce(length(p_result->'home'->>'name'),0) not between 1 and 100
 or coalesce(length(p_result->'away'->>'name'),0) not between 1 and 100 then raise exception 'invalid_result'; end if;
 if jsonb_array_length(p_result->'events')>1000 then raise exception 'invalid_result'; end if;
 update public.mp_friendlies set result=p_result where room_id=p_room;
 return p_result;
end $$;
revoke all on all functions in schema goalasso_private from public,anon;
grant execute on all functions in schema goalasso_private to authenticated;
create function public.mp_friendly_state(p_room uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.friendly_state(p_room)$$;
create function public.mp_friendly_ready(p_room uuid) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.friendly_ready(p_room)$$;
create function public.mp_friendly_commit(p_room uuid,p_result jsonb) returns jsonb language sql security invoker set search_path='' as $$select goalasso_private.friendly_commit(p_room,p_result)$$;
revoke all on function public.mp_friendly_state(uuid), public.mp_friendly_ready(uuid), public.mp_friendly_commit(uuid,jsonb) from public,anon;
grant execute on function public.mp_friendly_state(uuid), public.mp_friendly_ready(uuid), public.mp_friendly_commit(uuid,jsonb) to authenticated;
