-- Appletics — fusion des doublons d'athlètes et prévention. Ré-exécutable sans risque.

-- 1. Fusion : un même compte relié plusieurs fois dans un groupe → une seule fiche (la plus ancienne).
do $$
declare d record;
begin
  for d in
    select a.id as dup, k.keep
      from public.shared_athletes a
      join lateral (select b.id as keep from public.shared_athletes b
                     where b.group_id = a.group_id and b.user_id = a.user_id order by b.created_at, b.id limit 1) k on true
     where a.user_id is not null and a.id <> k.keep
  loop
    -- performances : déplacées si la fiche conservée n'en a pas déjà une sur la même séance
    update public.shared_performances p set athlete_id = d.keep
     where p.athlete_id = d.dup
       and not exists (select 1 from public.shared_performances q where q.session_id = p.session_id and q.athlete_id = d.keep);
    delete from public.shared_performances where athlete_id = d.dup;
    update public.shared_sessions set athlete_id = d.keep where athlete_id = d.dup;
    update public.shared_group_invitations set athlete_id = d.keep where athlete_id = d.dup;
    delete from public.shared_athletes where id = d.dup;
  end loop;
end $$;

-- 2. Séances / compétitions en double pour le même athlète (même type, titre et date) : on garde
--    celle qui a un résultat, sinon la plus ancienne.
delete from public.shared_sessions s
 using public.shared_sessions t
 where s.group_id = t.group_id and s.athlete_id is not distinct from t.athlete_id and s.kind = t.kind
   and s.title = t.title and s.session_date = t.session_date and s.id <> t.id
   and not exists (select 1 from public.shared_performances p where p.session_id = s.id)
   and (exists (select 1 from public.shared_performances p where p.session_id = t.id)
        or (t.created_at, t.id) < (s.created_at, s.id));

-- 3. Une seule fiche par compte et par groupe, désormais garanti.
create unique index if not exists shared_athletes_group_user_uidx on public.shared_athletes (group_id, user_id) where user_id is not null;

-- 4. Accepter une invitation quand on a déjà sa fiche dans le groupe : pas de nouvelle fiche,
--    la fiche créée pour l'invitation (vide) est retirée.
create or replace function public.shared_answer_invitation(p_invitation uuid, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare inv public.shared_group_invitations; v_name text; v_mine uuid;
begin
  select * into inv from public.shared_group_invitations where id = p_invitation for update;
  if not found or lower(inv.email) <> public.appletics_auth_email() then raise exception 'Access denied'; end if;
  if inv.status <> 'pending' or inv.expires_at <= now() then raise exception 'Invitation expired'; end if;
  if not p_accept then update public.shared_group_invitations set status = 'declined' where id = inv.id; return; end if;
  v_name := coalesce(public.appletics_display_name(auth.uid()), 'Membre');
  insert into public.shared_group_members (group_id, user_id, role, display_name) values (inv.group_id, auth.uid(), inv.role, v_name)
  on conflict (group_id, user_id) do update set role = case when shared_group_members.role = 'coach' then 'coach' else excluded.role end;
  if inv.role = 'athlete' then
    select id into v_mine from public.shared_athletes where group_id = inv.group_id and user_id = auth.uid() limit 1;
    if v_mine is null and inv.athlete_id is not null then
      update public.shared_athletes set user_id = auth.uid() where id = inv.athlete_id and user_id is null returning id into v_mine;
    end if;
    if v_mine is null then
      insert into public.shared_athletes (group_id, user_id, name) values (inv.group_id, auth.uid(), v_name) returning id into v_mine;
    end if;
    if inv.athlete_id is not null and inv.athlete_id <> v_mine then
      update public.shared_sessions set athlete_id = v_mine where athlete_id = inv.athlete_id;
      delete from public.shared_athletes a where a.id = inv.athlete_id and a.user_id is null
        and not exists (select 1 from public.shared_performances p where p.athlete_id = a.id);
    end if;
  end if;
  update public.shared_group_invitations set status = 'accepted' where id = inv.id;
end; $$;

-- 5. Invitation rapide : si la personne est déjà dans le groupe, on ne crée rien.
create or replace function public.shared_invite_athlete_quick(p_email text, p_name text default null, p_source text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group uuid; v_athlete uuid;
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_source text := nullif(btrim(coalesce(p_source, '')), '');
begin
  if auth.uid() is null or not public.appletics_account_active() then raise exception 'Access denied'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if v_name is not null and char_length(v_name) > 120 then raise exception 'Invalid name'; end if;
  select g.id into v_group from public.shared_groups g where g.owner_id = auth.uid() order by g.created_at limit 1;
  if v_group is null then v_group := public.shared_create_group('Athlètes de ' || coalesce(public.appletics_display_name(auth.uid()), 'mon groupe')); end if;
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
