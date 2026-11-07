-- Appletics — athlète invité relié à la fiche du coach, séances de programme envoyées à un athlète précis.
-- Ré-exécutable sans risque.

-- 1. Invitation rapide : garde le lien avec la fiche athlète du coach (p_source = identifiant de la fiche dans l'app).
drop function if exists public.shared_invite_athlete_quick(text, text);
create or replace function public.shared_invite_athlete_quick(p_email text, p_name text default null, p_source text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid;
  v_athlete uuid;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_source text := nullif(btrim(coalesce(p_source, '')), '');
begin
  if auth.uid() is null or not public.appletics_account_active() then raise exception 'Access denied'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if v_name is not null and char_length(v_name) > 120 then raise exception 'Invalid name'; end if;
  select g.id into v_group from public.shared_groups g where g.owner_id = auth.uid() order by g.created_at limit 1;
  if v_group is null then
    v_group := public.shared_create_group('Athlètes de ' || coalesce(public.appletics_display_name(auth.uid()), 'mon groupe'));
  end if;
  select a.id into v_athlete from public.shared_athletes a
   where a.group_id = v_group and a.user_id is null
     and ((v_source is not null and a.source_id = v_source) or lower(a.name) = lower(coalesce(v_name, split_part(v_email, '@', 1))))
   order by a.created_at limit 1;
  if v_athlete is null then
    v_athlete := public.shared_add_athlete(v_group, coalesce(v_name, split_part(v_email, '@', 1)), v_source);
  elsif v_source is not null then
    update public.shared_athletes set source_id = v_source where id = v_athlete and source_id is null;
  end if;
  return public.shared_invite(v_group, v_email, 'athlete', v_athlete::text);
end; $$;
revoke all on function public.shared_invite_athlete_quick(text, text, text) from public, anon;
grant execute on function public.shared_invite_athlete_quick(text, text, text) to authenticated;

-- 2. Séance destinée à un seul athlète (programme individuel) : visible par les coachs et cet athlète uniquement.
alter table public.shared_sessions add column if not exists athlete_id uuid references public.shared_athletes(id) on delete cascade;
drop policy if exists "shared_sessions_select" on public.shared_sessions;
create policy "shared_sessions_select" on public.shared_sessions for select to authenticated
  using (public.appletics_is_group_coach(group_id)
         or (public.appletics_is_group_member(group_id)
             and (athlete_id is null or exists (select 1 from public.shared_athletes a where a.id = athlete_id and a.user_id = auth.uid()))));

create or replace function public.shared_publish_athlete_session(p_athlete uuid, p_title text, p_date date, p_details text, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.shared_athletes; v_id uuid;
begin
  select * into a from public.shared_athletes where id = p_athlete;
  if a.id is null or not public.appletics_is_group_coach(a.group_id) then raise exception 'Access denied'; end if;
  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 200 then raise exception 'Invalid title'; end if;
  if nullif(btrim(coalesce(p_source, '')), '') is null then raise exception 'Invalid source'; end if;
  update public.shared_sessions set title = btrim(p_title), session_date = p_date, details = left(coalesce(p_details, ''), 10000), athlete_id = a.id, updated_at = now()
   where group_id = a.group_id and source_key = p_source returning id into v_id;
  if v_id is null then
    insert into public.shared_sessions (group_id, title, session_date, details, source_key, created_by, athlete_id)
    values (a.group_id, btrim(p_title), p_date, left(coalesce(p_details, ''), 10000), p_source, auth.uid(), a.id) returning id into v_id;
  end if;
  return v_id;
end; $$;
revoke all on function public.shared_publish_athlete_session(uuid, text, date, text, text) from public, anon;
grant execute on function public.shared_publish_athlete_session(uuid, text, date, text, text) to authenticated;
