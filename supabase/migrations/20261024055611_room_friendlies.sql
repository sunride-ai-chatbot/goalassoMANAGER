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
