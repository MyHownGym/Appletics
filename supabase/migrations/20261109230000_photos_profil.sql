-- Appletics — photo de profil visible par les coachs et membres des groupes.
alter table public.shared_group_members add column if not exists avatar text;
alter table public.shared_group_members drop constraint if exists shared_group_members_avatar_size;
alter table public.shared_group_members add constraint shared_group_members_avatar_size check (avatar is null or char_length(avatar) <= 400000);

-- Met la même photo sur toutes les adhésions de la personne connectée (null = retirer).
create or replace function public.appletics_set_member_avatar(p_avatar text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Access denied'; end if;
  if p_avatar is not null and (char_length(p_avatar) > 400000 or p_avatar !~ '^(data:image/(jpeg|png|webp);base64,|https://)') then raise exception 'Invalid avatar'; end if;
  update public.shared_group_members set avatar = p_avatar where user_id = auth.uid();
end; $$;
revoke all on function public.appletics_set_member_avatar(text) from public, anon;
grant execute on function public.appletics_set_member_avatar(text) to authenticated;

notify pgrst, 'reload schema';

-- Ajouter directement dans un groupe (et sa discussion) un athlète que le coach suit déjà dans un autre groupe.
-- Pas d'e-mail : la personne a déjà un compte et connaît ce coach.
create or replace function public.shared_add_known_athlete(p_group uuid, p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_athlete uuid; v_name text; v_avatar text;
begin
  if not public.appletics_is_group_coach(p_group) then raise exception 'Access denied'; end if;
  -- The athlete must already be in a group where the caller is a coach.
  select m.display_name, m.avatar into v_name, v_avatar from public.shared_group_members m
   where m.user_id = p_user and m.role = 'athlete'
     and exists (select 1 from public.shared_group_members c where c.group_id = m.group_id and c.user_id = auth.uid() and c.role = 'coach')
   limit 1;
  if v_name is null then raise exception 'Access denied'; end if;
  insert into public.shared_group_members (group_id, user_id, role, display_name, avatar)
  values (p_group, p_user, 'athlete', coalesce(nullif(v_name, ''), public.appletics_display_name(p_user), 'Athlète'), v_avatar)
  on conflict (group_id, user_id) do nothing;
  select id into v_athlete from public.shared_athletes where group_id = p_group and user_id = p_user limit 1;
  if v_athlete is null then
    insert into public.shared_athletes (group_id, name, user_id) values (p_group, coalesce(nullif(v_name, ''), 'Athlète'), p_user) returning id into v_athlete;
  end if;
  return v_athlete;
end; $$;
revoke all on function public.shared_add_known_athlete(uuid, uuid) from public, anon;
grant execute on function public.shared_add_known_athlete(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
