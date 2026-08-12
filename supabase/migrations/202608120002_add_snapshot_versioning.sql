alter table public.fieldnote_snapshots
  add column if not exists version bigint not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fieldnote_snapshots_version_positive'
      and conrelid = 'public.fieldnote_snapshots'::regclass
  ) then
    alter table public.fieldnote_snapshots
      add constraint fieldnote_snapshots_version_positive check (version > 0);
  end if;
end;
$$;

create or replace function public.save_fieldnote_snapshot(
  p_payload jsonb,
  p_schema_version integer,
  p_client_updated_at timestamptz,
  p_expected_version bigint
)
returns table (
  client_updated_at timestamptz,
  updated_at timestamptz,
  version bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current_version bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select snapshot.version
    into v_current_version
  from public.fieldnote_snapshots as snapshot
  where snapshot.user_id = v_user_id
  for update;

  if not found then
    if coalesce(p_expected_version, 0) <> 0 then
      raise exception 'Fieldnote snapshot version conflict.' using errcode = '40001';
    end if;

    begin
      insert into public.fieldnote_snapshots (
        user_id,
        payload,
        schema_version,
        client_updated_at,
        version
      ) values (
        v_user_id,
        p_payload,
        p_schema_version,
        p_client_updated_at,
        1
      );
    exception
      when unique_violation then
        raise exception 'Fieldnote snapshot version conflict.' using errcode = '40001';
    end;
  else
    if p_expected_version is distinct from v_current_version then
      raise exception 'Fieldnote snapshot version conflict.' using errcode = '40001';
    end if;

    update public.fieldnote_snapshots as snapshot
    set payload = p_payload,
        schema_version = p_schema_version,
        client_updated_at = p_client_updated_at,
        version = snapshot.version + 1
    where snapshot.user_id = v_user_id;
  end if;

  return query
  select snapshot.client_updated_at, snapshot.updated_at, snapshot.version
  from public.fieldnote_snapshots as snapshot
  where snapshot.user_id = v_user_id;
end;
$$;

revoke all on function public.save_fieldnote_snapshot(jsonb, integer, timestamptz, bigint) from public;
grant execute on function public.save_fieldnote_snapshot(jsonb, integer, timestamptz, bigint) to authenticated;
