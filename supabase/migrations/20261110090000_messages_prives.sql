-- Appletics — messages privés (1:1).
-- Une discussion privée est un groupe "direct" à deux membres : messages, réactions, fichiers,
-- notifications et pastilles « non lu » fonctionnent comme dans les groupes.
alter table public.shared_groups add column if not exists kind text not null default 'group';
alter table public.shared_groups drop constraint if exists shared_groups_kind_check;
alter table public.shared_groups add constraint shared_groups_kind_check check (kind in ('group', 'direct'));

-- Ouvre (ou crée) la discussion privée avec une personne d'un de mes groupes. Renvoie son id.
create or replace function public.appletics_open_direct(p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid;
begin
  if v_me is null or p_user is null or p_user = v_me then raise exception 'Access denied'; end if;
  -- Seulement entre personnes qui partagent déjà un groupe.
  if not exists (
    select 1 from public.shared_group_members a
    join public.shared_group_members b on b.group_id = a.group_id and b.user_id = p_user
    join public.shared_groups g on g.id = a.group_id and g.kind = 'group'
    where a.user_id = v_me
  ) then raise exception 'Access denied'; end if;
  select g.id into v_id from public.shared_groups g
    where g.kind = 'direct'
      and exists (select 1 from public.shared_group_members m where m.group_id = g.id and m.user_id = v_me)
      and exists (select 1 from public.shared_group_members m where m.group_id = g.id and m.user_id = p_user)
    limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.shared_groups (owner_id, name, kind) values (v_me, 'Message privé', 'direct') returning id into v_id;
  -- Rôle « athlete » pour les deux : aucune action de coach possible dans une discussion privée.
  insert into public.shared_group_members (group_id, user_id, role, display_name, avatar)
  select v_id, u.id, 'athlete',
    coalesce((select m.display_name from public.shared_group_members m where m.user_id = u.id and m.display_name <> '' limit 1), public.appletics_display_name(u.id), ''),
    (select m.avatar from public.shared_group_members m where m.user_id = u.id and m.avatar is not null limit 1)
  from (values (v_me), (p_user)) as u(id);
  return v_id;
end; $$;
revoke all on function public.appletics_open_direct(uuid) from public, anon;
grant execute on function public.appletics_open_direct(uuid) to authenticated;

notify pgrst, 'reload schema';
