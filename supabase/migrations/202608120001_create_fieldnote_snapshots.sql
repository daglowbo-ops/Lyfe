create table if not exists public.fieldnote_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  client_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint fieldnote_snapshots_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint fieldnote_snapshots_schema_version_positive check (schema_version > 0)
);

alter table public.fieldnote_snapshots enable row level security;
alter table public.fieldnote_snapshots force row level security;

revoke all on table public.fieldnote_snapshots from anon;
grant select, insert, update, delete on table public.fieldnote_snapshots to authenticated;

drop policy if exists "Users can read their own Fieldnote snapshot" on public.fieldnote_snapshots;
create policy "Users can read their own Fieldnote snapshot"
  on public.fieldnote_snapshots
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Fieldnote snapshot" on public.fieldnote_snapshots;
create policy "Users can create their own Fieldnote snapshot"
  on public.fieldnote_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Fieldnote snapshot" on public.fieldnote_snapshots;
create policy "Users can update their own Fieldnote snapshot"
  on public.fieldnote_snapshots
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Fieldnote snapshot" on public.fieldnote_snapshots;
create policy "Users can delete their own Fieldnote snapshot"
  on public.fieldnote_snapshots
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_fieldnote_snapshot_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_fieldnote_snapshot_updated_at on public.fieldnote_snapshots;
create trigger set_fieldnote_snapshot_updated_at
before update on public.fieldnote_snapshots
for each row execute function public.set_fieldnote_snapshot_updated_at();

