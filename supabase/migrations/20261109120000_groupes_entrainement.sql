-- Appletics — groupes d'entraînement (Sprint, Demi-fond…) partagés entre plusieurs coachs.
-- 1. Chaque groupe a une discipline.
alter table public.shared_groups add column if not exists discipline text not null default 'all';
alter table public.shared_groups drop constraint if exists shared_groups_discipline_check;
alter table public.shared_groups add constraint shared_groups_discipline_check
  check (discipline in ('all', 'sprints', 'distance', 'hurdles', 'jumps', 'throws', 'relay'));

-- 2. Créer un groupe avec sa discipline.
create or replace function public.shared_create_training_group(p_name text, p_discipline text default 'all') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_discipline text := coalesce(nullif(btrim(coalesce(p_discipline, '')), ''), 'all');
begin
  if v_discipline not in ('all', 'sprints', 'distance', 'hurdles', 'jumps', 'throws', 'relay') then raise exception 'Invalid discipline'; end if;
  v_id := public.shared_create_group(p_name);
  update public.shared_groups set discipline = v_discipline where id = v_id;
  return v_id;
end; $$;
revoke all on function public.shared_create_training_group(text, text) from public, anon;
grant execute on function public.shared_create_training_group(text, text) to authenticated;

-- 3. Renommer un groupe / changer sa discipline (coachs du groupe).
create or replace function public.shared_update_group(p_group uuid, p_name text, p_discipline text) returns void
language plpgsql security definer set search_path = public as $$
declare v_discipline text := coalesce(nullif(btrim(coalesce(p_discipline, '')), ''), 'all');
begin
  if not public.appletics_is_group_coach(p_group) then raise exception 'Access denied'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 120 then raise exception 'Invalid name'; end if;
  if v_discipline not in ('all', 'sprints', 'distance', 'hurdles', 'jumps', 'throws', 'relay') then raise exception 'Invalid discipline'; end if;
  update public.shared_groups set name = btrim(p_name), discipline = v_discipline where id = p_group;
  update public.shared_group_invitations set group_name = btrim(p_name) where group_id = p_group and status = 'pending';
end; $$;
revoke all on function public.shared_update_group(uuid, text, text) from public, anon;
grant execute on function public.shared_update_group(uuid, text, text) to authenticated;

-- 4. Invitation rapide : le coach choisit le groupe (sinon son premier groupe, créé au besoin).
drop function if exists public.shared_invite_athlete_quick(text, text, text);
create or replace function public.shared_invite_athlete_quick(p_email text, p_name text default null, p_source text default null, p_group uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid := p_group; v_athlete uuid;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_source text := nullif(btrim(coalesce(p_source, '')), '');
begin
  if auth.uid() is null or not public.appletics_account_active() then raise exception 'Access denied'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if v_name is not null and char_length(v_name) > 120 then raise exception 'Invalid name'; end if;
  if v_group is not null then
    if not public.appletics_is_group_coach(v_group) then raise exception 'Access denied'; end if;
  else
    select g.id into v_group from public.shared_groups g join public.shared_group_members m on m.group_id = g.id
     where m.user_id = auth.uid() and m.role = 'coach' order by (g.owner_id = auth.uid()) desc, g.created_at limit 1;
    if v_group is null then v_group := public.shared_create_group('Athlètes de ' || coalesce(public.appletics_display_name(auth.uid()), 'mon groupe')); end if;
  end if;
  if exists (select 1 from public.shared_athletes a join public.user_profiles p on p.id = a.user_id
              where a.group_id = v_group and lower(p.email) = v_email) then
    raise exception 'Already member';
  end if;
  select a.id into v_athlete from public.shared_athletes a
   where a.group_id = v_group and a.user_id is null
     and ((v_source is not null and a.source_id = v_source) or lower(a.name) = lower(coalesce(v_name, split_part(v_email, '@', 1)))
          or exists (select 1 from public.shared_group_invitations i where i.athlete_id = a.id and lower(i.email) = v_email))
   order by a.created_at limit 1;
  if v_athlete is null then v_athlete := public.shared_add_athlete(v_group, coalesce(v_name, split_part(v_email, '@', 1)), v_source);
  elsif v_source is not null then update public.shared_athletes set source_id = v_source where id = v_athlete and source_id is null; end if;
  return public.shared_invite(v_group, v_email, 'athlete', v_athlete::text);
end; $$;
revoke all on function public.shared_invite_athlete_quick(text, text, text, uuid) from public, anon;
grant execute on function public.shared_invite_athlete_quick(text, text, text, uuid) to authenticated;

notify pgrst, 'reload schema';
