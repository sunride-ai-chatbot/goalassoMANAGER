-- Transactional backend regression for the base room service (20261024000000_rooms.sql): nothing it creates persists.
begin;
do $$
declare h uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); x uuid:=gen_random_uuid(); room jsonb; again jsonb; v jsonb; snap jsonb; snap2 jsonb; snap3 jsonb; inv uuid; rid uuid;
begin
 insert into auth.users(id,aud,role) values(h,'authenticated','authenticated'),(g,'authenticated','authenticated'),(x,'authenticated','authenticated');
 snap:=jsonb_build_object('careerId','base-1','season',1,'round',1,'club',jsonb_build_object('name','Base Home','country','Test','players',(select jsonb_agg(jsonb_build_object('id',i)) from generate_series(1,11) i)));
 snap2:=jsonb_set(jsonb_set(snap,'{club,name}','"Base Away"'),'{careerId}','"base-2"');
 snap3:=jsonb_set(jsonb_set(snap,'{club,name}','"Base Third"'),'{careerId}','"base-3"');
 -- nobody signed in
 perform set_config('request.jwt.claim.sub','',true);
 execute 'set local role authenticated';
 begin perform public.mp_create_room(snap,2);raise exception 'expected login_required';
 exception when raise_exception then if sqlerrm<>'login_required' then raise; end if;end;
 -- the host: refused snapshots, then a room
 perform set_config('request.jwt.claim.sub',h::text,true);
 begin perform public.mp_create_room('{}'::jsonb,2);raise exception 'expected invalid_snapshot';
 exception when raise_exception then if sqlerrm<>'invalid_snapshot' then raise; end if;end;
 begin perform public.mp_create_room(jsonb_set(snap,'{club,players}','[]'),2);raise exception 'expected invalid_snapshot';
 exception when raise_exception then if sqlerrm<>'invalid_snapshot' then raise; end if;end;
 begin perform public.mp_create_room(snap,9);raise exception 'expected invalid_capacity';
 exception when raise_exception then if sqlerrm<>'invalid_capacity' then raise; end if;end;
 assert public.mp_validate_snapshot(snap);
 room:=public.mp_create_room(snap,2);rid:=(room->>'id')::uuid;inv:=(room->>'invitation')::uuid;
 assert rid is not null and inv is not null and rid<>inv,'the invitation is not the room id';
 v:=public.mp_get_room(rid);assert (v->>'host')::boolean and jsonb_array_length(v->'members')=1 and v->'members'->0->>'club'='Base Home';
 -- the invitation dialog, before anybody signs in
 execute 'reset role';perform set_config('request.jwt.claim.sub','',true);execute 'set local role anon';
 v:=public.mp_preview_invitation(inv);assert v->>'club'='Base Home' and not (v->>'full')::boolean and (select count(*) from jsonb_object_keys(v))=2,'the preview is the club and whether the room is full, nothing else';
 begin perform public.mp_preview_invitation(gen_random_uuid());raise exception 'expected invitation_expired';
 exception when raise_exception then if sqlerrm<>'invitation_expired' then raise; end if;end;
 begin perform public.mp_preview_invitation(rid);raise exception 'expected invitation_expired';
 exception when raise_exception then if sqlerrm<>'invitation_expired' then raise; end if;end;
 assert not has_function_privilege('anon','public.mp_create_room(jsonb,integer)','execute');
 assert not has_function_privilege('anon','public.mp_join_room(uuid,jsonb)','execute');
 assert not has_function_privilege('anon','public.mp_get_room(uuid)','execute');
 assert not has_table_privilege('anon','public.mp_rooms','select') and not has_table_privilege('anon','public.mp_members','select');
 execute 'reset role';execute 'set local role authenticated';
 -- the guest: joins once, a second call changes nothing, another career is refused
 perform set_config('request.jwt.claim.sub',g::text,true);
 again:=public.mp_join_room(inv,snap2);assert (again->>'id')::uuid=rid;
 again:=public.mp_join_room(inv,jsonb_set(snap2,'{season}','7'));assert (again->>'id')::uuid=rid;
 begin perform public.mp_join_room(inv,jsonb_set(snap2,'{careerId}','"another"'));raise exception 'expected different_career';
 exception when raise_exception then if sqlerrm<>'different_career' then raise; end if;end;
 v:=public.mp_get_room(rid);assert not (v->>'host')::boolean and jsonb_array_length(v->'members')=2 and (v->'members'->0->>'host')::boolean and (v->'members'->1->>'mine')::boolean;
 v:=public.mp_preview_invitation(inv);assert (v->>'full')::boolean;
 -- a third manager
 perform set_config('request.jwt.claim.sub',x::text,true);
 begin perform public.mp_join_room(inv,snap3);raise exception 'expected room_full';
 exception when raise_exception then if sqlerrm<>'room_full' then raise; end if;end;
 begin perform public.mp_get_room(rid);raise exception 'expected not_a_member';
 exception when raise_exception then if sqlerrm<>'not_a_member' then raise; end if;end;
 assert not has_table_privilege('authenticated','public.mp_rooms','select') and not has_table_privilege('authenticated','public.mp_members','select');
 assert not has_table_privilege('authenticated','public.mp_rooms','insert') and not has_table_privilege('authenticated','public.mp_members','update');
 -- the squad is the one he joined with
 execute 'reset role';
 assert (select snapshot->>'season' from public.mp_members where room_id=rid and owner_id=g)='1','a second join does not replace the frozen squad';
 -- an invitation ends
 update public.mp_rooms set expires_at=now()-interval '1 minute' where id=rid;
 execute 'set local role authenticated';
 begin perform public.mp_join_room(inv,snap3);raise exception 'expected invitation_expired';
 exception when raise_exception then if sqlerrm<>'invitation_expired' then raise; end if;end;
 begin perform public.mp_preview_invitation(inv);raise exception 'expected invitation_expired';
 exception when raise_exception then if sqlerrm<>'invitation_expired' then raise; end if;end;
 execute 'reset role';
end $$;
select 'passed: sign-in gate, snapshot checks, invitation preview for guests, one join per manager, career lock, room size, privacy of the tables, expiry' as result;
rollback;
