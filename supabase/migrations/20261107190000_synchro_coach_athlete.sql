-- Appletics — synchronisation coach ↔ athlète : séances et compétitions ciblées, retrait.
-- Ré-exécutable sans risque.
alter table public.shared_sessions add column if not exists kind text not null default 'session';
alter table public.shared_sessions add column if not exists meta jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'shared_sessions_kind_check') then
    alter table public.shared_sessions add constraint shared_sessions_kind_check check (kind in ('session', 'competition'));
  end if;
end $$;

-- Séance ou compétition destinée à un athlète précis (programme, inscription à une compétition).
create or replace function public.shared_publish_athlete_item(p_athlete uuid, p_kind text, p_title text, p_date date, p_details text, p_meta jsonb, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.shared_athletes; v_id uuid;
begin
  select * into a from public.shared_athletes where id = p_athlete;
  if a.id is null or not public.appletics_is_group_coach(a.group_id) then raise exception 'Access denied'; end if;
  if p_kind not in ('session', 'competition') then raise exception 'Invalid kind'; end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 200 then raise exception 'Invalid title'; end if;
  if nullif(btrim(coalesce(p_source, '')), '') is null then raise exception 'Invalid source'; end if;
  if p_meta is not null and (jsonb_typeof(p_meta) <> 'object' or octet_length(p_meta::text) > 8000) then raise exception 'Invalid meta'; end if;
  update public.shared_sessions
     set title = btrim(p_title), session_date = p_date, details = left(coalesce(p_details, ''), 10000), athlete_id = a.id,
         kind = p_kind, meta = coalesce(p_meta, '{}'::jsonb), updated_at = now()
   where group_id = a.group_id and source_key = p_source returning id into v_id;
  if v_id is null then
    insert into public.shared_sessions (group_id, title, session_date, details, source_key, created_by, athlete_id, kind, meta)
    values (a.group_id, btrim(p_title), p_date, left(coalesce(p_details, ''), 10000), p_source, auth.uid(), a.id, p_kind, coalesce(p_meta, '{}'::jsonb))
    returning id into v_id;
  end if;
  return v_id;
end; $$;
revoke all on function public.shared_publish_athlete_item(uuid, text, text, date, text, jsonb, text) from public, anon;
grant execute on function public.shared_publish_athlete_item(uuid, text, text, date, text, jsonb, text) to authenticated;

-- Retrait par le coach (athlète retiré d'un programme ou d'une compétition). Ce qui a déjà un résultat est conservé.
create or replace function public.shared_delete_published(p_ids uuid[]) returns integer
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  delete from public.shared_sessions s
   where s.id = any(coalesce(p_ids, array[]::uuid[]))
     and s.source_key is not null
     and public.appletics_is_group_coach(s.group_id)
     and not exists (select 1 from public.shared_performances p where p.session_id = s.id);
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
revoke all on function public.shared_delete_published(uuid[]) from public, anon;
grant execute on function public.shared_delete_published(uuid[]) to authenticated;
