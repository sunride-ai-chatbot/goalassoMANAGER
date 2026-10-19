-- GOALASSO · Phase 2 schema (single-player cloud careers). NOT applied yet.
-- Single-player data lives under the sp_ prefix; future multiplayer will use its own tables
-- and must never trust these client-written snapshots.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  created_at  timestamptz not null default now()
);

create table if not exists public.sp_careers (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mode           text not null default 'singlePlayer' check (mode = 'singlePlayer'),
  schema_version int  not null,
  revision       int  not null default 1,
  meta           jsonb not null default '{}'::jsonb,  -- manager, club, season, round, for career cards
  state          jsonb not null,                       -- versioned career snapshot (same JSON as the local save)
  client_career_id text,                               -- local careerId, makes guest uploads idempotent
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (owner_id, client_career_id)
);

create table if not exists public.sp_career_backups (
  id         bigint generated always as identity primary key,
  career_id  uuid not null references public.sp_careers(id) on delete cascade,
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  revision   int  not null,
  state      jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles          enable row level security;
alter table public.sp_careers        enable row level security;
alter table public.sp_career_backups enable row level security;

-- Ownership is enforced in the database, not in the app.
create policy "own profile"        on public.profiles          for all using (id = auth.uid())       with check (id = auth.uid());
create policy "own careers"        on public.sp_careers        for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own career backups" on public.sp_career_backups for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Save with optimistic concurrency: succeeds only if the caller saw the latest revision.
-- Keeps the previous snapshot as a backup in the same transaction.
create or replace function public.sp_save_career(p_id uuid, p_expected_revision int, p_state jsonb, p_meta jsonb, p_schema_version int)
returns int
language plpgsql
security invoker
as $$
declare new_rev int;
begin
  insert into public.sp_career_backups (career_id, owner_id, revision, state)
    select id, owner_id, revision, state from public.sp_careers
    where id = p_id and owner_id = auth.uid() and revision = p_expected_revision;
  update public.sp_careers
     set state = p_state, meta = p_meta, schema_version = p_schema_version,
         revision = revision + 1, updated_at = now()
   where id = p_id and owner_id = auth.uid() and revision = p_expected_revision
  returning revision into new_rev;
  if new_rev is null then
    raise exception 'revision_conflict' using errcode = 'P0001';
  end if;
  -- keep the 5 most recent backups per career
  delete from public.sp_career_backups b
   where b.career_id = p_id and b.id not in (
     select id from public.sp_career_backups where career_id = p_id order by id desc limit 5);
  return new_rev;
end $$;
