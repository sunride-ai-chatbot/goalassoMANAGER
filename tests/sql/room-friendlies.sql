-- Transactional backend regression: generated test users/rooms never persist.
begin;
do $$
declare h uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); room jsonb; st jsonb; snap jsonb; result jsonb; v jsonb;
begin
 insert into auth.users(id,aud,role) values(h,'authenticated','authenticated'),(g,'authenticated','authenticated'),(outsider,'authenticated','authenticated');
 snap:=jsonb_build_object('careerId','test-career','season',1,'round',1,'club',jsonb_build_object('name','Test Home','country','Test','players',(select jsonb_agg(jsonb_build_object('id',i)) from generate_series(1,11) i)));
 perform set_config('request.jwt.claim.sub',h::text,true);
 execute 'set local role authenticated';
 room:=public.mp_create_room(snap,2);
 st:=public.mp_friendly_state((room->>'id')::uuid);
 assert (st->>'host')::boolean and jsonb_array_length(st->'members')=1;
 perform public.mp_friendly_ready((room->>'id')::uuid);
 begin
  perform public.mp_friendly_commit((room->>'id')::uuid,'{}');raise exception 'expected not_ready';
 exception when raise_exception then if sqlerrm<>'not_ready' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',g::text,true);
 begin
  perform public.mp_join_room((room->>'invitation')::uuid,snap);raise exception 'expected club_taken';
 exception when raise_exception then if sqlerrm<>'club_taken' then raise; end if;end;
 snap:=jsonb_set(snap,'{club,name}','"Test Away"');
 perform public.mp_join_room((room->>'invitation')::uuid,snap);
 st:=public.mp_friendly_ready((room->>'id')::uuid);assert jsonb_array_length(st->'members')=2 and not (st->>'host')::boolean;
 begin
  perform public.mp_friendly_commit((room->>'id')::uuid,'{}');raise exception 'expected host_only';
 exception when raise_exception then if sqlerrm<>'host_only' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',outsider::text,true);
 begin
  perform public.mp_friendly_state((room->>'id')::uuid);raise exception 'expected not_a_member';
 exception when raise_exception then if sqlerrm<>'not_a_member' then raise; end if;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 result:='{"home":{"name":"Test Home"},"away":{"name":"Test Away"},"gh":2,"ga":1,"minutes":90,"events":[]}'::jsonb;
 v:=public.mp_friendly_commit((room->>'id')::uuid,result);assert v=result;
 v:=public.mp_friendly_commit((room->>'id')::uuid,jsonb_set(result,'{gh}','9'));assert v=result;
 perform set_config('request.jwt.claim.sub',g::text,true);
 st:=public.mp_friendly_state((room->>'id')::uuid);assert st->'result'=result;
 assert not has_table_privilege('authenticated','public.mp_friendlies','select');
 assert not has_function_privilege('anon','public.mp_friendly_state(uuid)','execute');
 execute 'reset role';
end $$;
select 'passed: membership, duplicate club, ready gate, host authority, immutable result and shared guest score' as result;
rollback;
