-- Appletics — invitation rapide d'un athlète (bouton « Inviter » de l'écran Ajouter un athlète)
-- À coller dans Supabase > SQL Editor > Run (ré-exécutable sans risque).
-- Le coach saisit un nom et un e-mail : l'athlète est ajouté à son groupe principal
-- (créé automatiquement s'il n'existe pas) et une invitation est enregistrée pour cet e-mail.

create or replace function public.shared_invite_athlete_quick(p_email text, p_name text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid;
  v_athlete uuid;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if auth.uid() is null or not public.appletics_account_active() then raise exception 'Access denied'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if v_name is not null and char_length(v_name) > 120 then raise exception 'Invalid name'; end if;

  -- Groupe principal du coach : le plus ancien dont il est propriétaire, sinon on le crée.
  select g.id into v_group from public.shared_groups g where g.owner_id = auth.uid() order by g.created_at limit 1;
  if v_group is null then
    v_group := public.shared_create_group('Athlètes de ' || coalesce(public.appletics_display_name(auth.uid()), 'mon groupe'));
  end if;

  -- Fiche athlète non reliée portant ce nom, sinon nouvelle fiche (nom par défaut : début de l'e-mail).
  select a.id into v_athlete from public.shared_athletes a
   where a.group_id = v_group and a.user_id is null and lower(a.name) = lower(coalesce(v_name, split_part(v_email, '@', 1)))
   order by a.created_at limit 1;
  if v_athlete is null then
    v_athlete := public.shared_add_athlete(v_group, coalesce(v_name, split_part(v_email, '@', 1)), null);
  end if;

  return public.shared_invite(v_group, v_email, 'athlete', v_athlete::text);
end; $$;
revoke all on function public.shared_invite_athlete_quick(text, text) from public, anon;
grant execute on function public.shared_invite_athlete_quick(text, text) to authenticated;
