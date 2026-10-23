-- Invitation/lobby phase only. Does not execute matches or change career balances.
create table public.mp_rooms (
 id uuid primary key default gen_random_uuid(),
 invitation uuid not null unique default gen_random_uuid(),
 host_id uuid not null references auth.users(id),
 capacity int not null default 2 check(capacity between 2 and 16),
 expires_at timestamptz not null default now()+interval '7 days',
 created_at timestamptz not null default now()
);
create table public.mp_members (
 room_id uuid not null references public.mp_rooms(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 career_id text not null,
 club_key text not null,
 snapshot jsonb not null,
 primary key(room_id,owner_id), unique(room_id,club_key)
);
alter table public.mp_rooms enable row level security;
alter table public.mp_members enable row level security;
-- No direct client table access: all membership decisions take place in a transaction.
revoke all on public.mp_rooms,public.mp_members from anon,authenticated;
create function public.mp_validate_snapshot(s jsonb) returns text language plpgsql set search_path=public as $$
begin
 if s is null or jsonb_typeof(s)<>'object' or octet_length(s::text)>500000
 or coalesce(length(s->>'careerId'),0) not between 1 and 100
 or coalesce(length(s->'club'->>'name'),0) not between 1 and 100
 or coalesce(length(s->'club'->>'country'),0) not between 1 and 80
 or jsonb_typeof(s->'club'->'players') is distinct from 'array' then raise exception 'invalid_snapshot'; end if;
 if jsonb_array_length(s->'club'->'players') not between 11 and 100 then raise exception 'invalid_squad'; end if;
 -- Club identity is computed on the server, never accepted as a separate client field.
 return lower(trim(s->'club'->>'country'))||':'||lower(trim(s->'club'->>'name'));
end $$;
create function public.mp_create_room(p_snapshot jsonb,p_capacity int default 2) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.mp_rooms; k text;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 if p_capacity is null or p_capacity not between 2 and 16 then raise exception 'invalid_capacity'; end if;
 k:=public.mp_validate_snapshot(p_snapshot);
 if (select count(*) from public.mp_rooms where host_id=auth.uid() and expires_at>now())>=10 then raise exception 'room_limit'; end if;
 insert into public.mp_rooms(host_id,capacity) values(auth.uid(),p_capacity) returning * into r;
 insert into public.mp_members values(r.id,auth.uid(),p_snapshot->>'careerId',k,p_snapshot);
 return jsonb_build_object('id',r.id,'invitation',r.invitation,'expiresAt',r.expires_at);
end $$;
create function public.mp_preview_invitation(p_invitation uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.mp_rooms; s jsonb;
begin
 select * into r from public.mp_rooms where invitation=p_invitation and expires_at>now();
 if not found then raise exception 'invitation_expired'; end if;
 select snapshot into s from public.mp_members where room_id=r.id and owner_id=r.host_id;
 return jsonb_build_object('club',s->'club'->>'name','country',s->'club'->>'country','capacity',r.capacity,'full',(select count(*)>=r.capacity from public.mp_members where room_id=r.id),'expiresAt',r.expires_at);
end $$;
create function public.mp_join_room(p_invitation uuid,p_snapshot jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.mp_rooms; k text; existing public.mp_members;
begin
 if auth.uid() is null then raise exception 'login_required'; end if;
 k:=public.mp_validate_snapshot(p_snapshot);
 select * into r from public.mp_rooms where invitation=p_invitation and expires_at>now() for update;
 if not found then raise exception 'invitation_expired'; end if;
 select * into existing from public.mp_members where room_id=r.id and owner_id=auth.uid();
 if found then
   if existing.career_id<>p_snapshot->>'careerId' then raise exception 'different_career'; end if;
   return jsonb_build_object('id',r.id);
 end if;
 if exists(select 1 from public.mp_members where room_id=r.id and club_key=k) then raise exception 'club_taken'; end if;
 if (select count(*) from public.mp_members where room_id=r.id)>=r.capacity then raise exception 'room_full'; end if;
 -- Rosters are independent per (room_id, owner_id). Shared real-player identities are allowed.
 insert into public.mp_members values(r.id,auth.uid(),p_snapshot->>'careerId',k,p_snapshot);
 return jsonb_build_object('id',r.id);
end $$;
create function public.mp_get_room(p_room uuid) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.mp_members where room_id=p_room and owner_id=auth.uid()) then raise exception 'not_a_member'; end if;
 return (select jsonb_build_object('id',r.id,'capacity',r.capacity,'expiresAt',r.expires_at,'expired',r.expires_at<=now(),'members',(select jsonb_agg(jsonb_build_object('mine',m.owner_id=auth.uid(),'club',m.snapshot->'club'->>'name','players',jsonb_array_length(m.snapshot->'club'->'players'),'season',m.snapshot->'season','round',m.snapshot->'round')) from public.mp_members m where room_id=r.id)) from public.mp_rooms r where r.id=p_room);
end $$;
revoke all on function public.mp_validate_snapshot(jsonb),public.mp_create_room(jsonb,int),public.mp_preview_invitation(uuid),public.mp_join_room(uuid,jsonb),public.mp_get_room(uuid) from public,anon,authenticated;
grant execute on function public.mp_preview_invitation(uuid) to anon,authenticated;
grant execute on function public.mp_create_room(jsonb,int),public.mp_join_room(uuid,jsonb),public.mp_get_room(uuid) to authenticated;
