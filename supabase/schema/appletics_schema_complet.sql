-- =====================================================================
-- Appletics — schéma complet pour un projet Supabase neuf (hors OnSpace)
-- À coller une seule fois dans Supabase > SQL Editor > New query > Run.
-- Recréé à partir du code de l'app : profils, groupes partagés, invitations,
-- séances et performances partagées, messagerie de groupe, abonnements Stripe,
-- suppression de compte. Ré-exécutable sans risque (idempotent).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Profils utilisateurs (créés automatiquement à l'inscription)
-- ---------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  appletics_profile jsonb,
  account_deleted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
drop policy if exists "user_profiles_own_select" on public.user_profiles;
create policy "user_profiles_own_select" on public.user_profiles for select to authenticated using (id = auth.uid());
drop policy if exists "user_profiles_own_update" on public.user_profiles;
create policy "user_profiles_own_update" on public.user_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, update on public.user_profiles to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, username)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.sync_user_metadata() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.user_profiles
     set email = new.email,
         username = coalesce(new.raw_user_meta_data->>'username', old.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
   where id = new.id and account_deleted_at is null;
  return new;
end; $$;
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email, raw_user_meta_data on auth.users for each row execute function public.sync_user_metadata();

create or replace function public.appletics_account_active() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_profiles where id = auth.uid() and account_deleted_at is null);
$$;
revoke all on function public.appletics_account_active() from public, anon;
grant execute on function public.appletics_account_active() to authenticated;

-- Nom affiché dans les groupes : nom du profil Appletics, sinon pseudo, sinon début de l'e-mail
create or replace function public.appletics_display_name(p_user uuid) returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(btrim(p.appletics_profile->>'name'), ''), nullif(btrim(p.username), ''), split_part(p.email, '@', 1), 'Membre')
    from public.user_profiles p where p.id = p_user;
$$;
revoke all on function public.appletics_display_name(uuid) from public, anon;

create or replace function public.appletics_auth_email() returns text language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email', ''));
$$;

-- ---------------------------------------------------------------------
-- 2. Groupes partagés
-- ---------------------------------------------------------------------
create table if not exists public.shared_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.shared_group_members (
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('coach', 'athlete')),
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists shared_group_members_user_idx on public.shared_group_members (user_id);

create table if not exists public.shared_athletes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  source_id text,
  created_at timestamptz not null default now()
);
create index if not exists shared_athletes_group_idx on public.shared_athletes (group_id);

create table if not exists public.shared_group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  group_name text not null default '',
  email text not null,
  role text not null check (role in ('coach', 'athlete')),
  athlete_id uuid references public.shared_athletes(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);
create index if not exists shared_group_invitations_email_idx on public.shared_group_invitations (lower(email));

create table if not exists public.shared_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  session_date date not null,
  details text not null default '' check (char_length(details) <= 10000),
  source_key text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists shared_sessions_source_uidx on public.shared_sessions (group_id, source_key) where source_key is not null;

create table if not exists public.shared_performances (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  session_id uuid not null references public.shared_sessions(id) on delete cascade,
  athlete_id uuid not null references public.shared_athletes(id) on delete cascade,
  performed_on date not null,
  metrics jsonb not null default '[]'::jsonb,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, athlete_id)
);

create table if not exists public.shared_performance_audit (
  id bigint generated always as identity primary key,
  group_id uuid,
  athlete_id uuid,
  performance_id uuid,
  action text not null,
  actor_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- Contrôles d'accès (security definer : pas de récursion RLS)
create or replace function public.appletics_is_group_member(p_group uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shared_group_members m where m.group_id = p_group and m.user_id = auth.uid());
$$;
create or replace function public.appletics_is_group_coach(p_group uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shared_group_members m where m.group_id = p_group and m.user_id = auth.uid() and m.role = 'coach');
$$;
revoke all on function public.appletics_is_group_member(uuid) from public, anon;
revoke all on function public.appletics_is_group_coach(uuid) from public, anon;
grant execute on function public.appletics_is_group_member(uuid) to authenticated;
grant execute on function public.appletics_is_group_coach(uuid) to authenticated;

-- Lecture : membres du groupe. Écriture : uniquement via les fonctions shared_* ci-dessous.
alter table public.shared_groups enable row level security;
alter table public.shared_group_members enable row level security;
alter table public.shared_athletes enable row level security;
alter table public.shared_group_invitations enable row level security;
alter table public.shared_sessions enable row level security;
alter table public.shared_performances enable row level security;
alter table public.shared_performance_audit enable row level security;

drop policy if exists "shared_groups_select" on public.shared_groups;
create policy "shared_groups_select" on public.shared_groups for select to authenticated using (public.appletics_is_group_member(id));
drop policy if exists "shared_group_members_select" on public.shared_group_members;
create policy "shared_group_members_select" on public.shared_group_members for select to authenticated using (public.appletics_is_group_member(group_id));
drop policy if exists "shared_athletes_select" on public.shared_athletes;
create policy "shared_athletes_select" on public.shared_athletes for select to authenticated using (public.appletics_is_group_member(group_id));
drop policy if exists "shared_invitations_select" on public.shared_group_invitations;
create policy "shared_invitations_select" on public.shared_group_invitations for select to authenticated
  using (public.appletics_is_group_coach(group_id) or lower(email) = public.appletics_auth_email());
drop policy if exists "shared_sessions_select" on public.shared_sessions;
create policy "shared_sessions_select" on public.shared_sessions for select to authenticated using (public.appletics_is_group_member(group_id));
drop policy if exists "shared_performances_select" on public.shared_performances;
create policy "shared_performances_select" on public.shared_performances for select to authenticated
  using (public.appletics_is_group_coach(group_id)
         or exists (select 1 from public.shared_athletes a where a.id = athlete_id and a.user_id = auth.uid()));
drop policy if exists "shared_performance_audit_select" on public.shared_performance_audit;
create policy "shared_performance_audit_select" on public.shared_performance_audit for select to authenticated using (public.appletics_is_group_coach(group_id));

grant select on public.shared_groups, public.shared_group_members, public.shared_athletes, public.shared_group_invitations,
  public.shared_sessions, public.shared_performances, public.shared_performance_audit to authenticated;

create or replace function public.shared_audit_performance() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.shared_groups where id = old.group_id) then
      insert into public.shared_performance_audit (group_id, athlete_id, performance_id, action, actor_id, before_data)
      values (old.group_id, old.athlete_id, old.id, 'delete', auth.uid(), to_jsonb(old));
    end if;
    return old;
  end if;
  insert into public.shared_performance_audit (group_id, athlete_id, performance_id, action, actor_id, before_data, after_data)
  values (new.group_id, new.athlete_id, new.id, lower(tg_op), auth.uid(), case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return new;
end; $$;
drop trigger if exists shared_performances_audit on public.shared_performances;
create trigger shared_performances_audit after insert or update or delete on public.shared_performances for each row execute function public.shared_audit_performance();

-- ---------------------------------------------------------------------
-- 3. Opérations des groupes (appelées par l'app via rpc)
-- ---------------------------------------------------------------------
create or replace function public.shared_create_group(p_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.appletics_account_active() then raise exception 'Access denied'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 120 then raise exception 'Invalid name'; end if;
  insert into public.shared_groups (owner_id, name) values (auth.uid(), btrim(p_name)) returning id into v_id;
  insert into public.shared_group_members (group_id, user_id, role, display_name)
  values (v_id, auth.uid(), 'coach', coalesce(public.appletics_display_name(auth.uid()), 'Coach'));
  return v_id;
end; $$;

create or replace function public.shared_invite(p_group uuid, p_email text, p_role text, p_athlete text default null) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text := lower(btrim(coalesce(p_email, ''))); v_athlete uuid := nullif(btrim(coalesce(p_athlete, '')), '')::uuid;
begin
  if not public.appletics_is_group_coach(p_group) then raise exception 'Access denied'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;
  if p_role not in ('coach', 'athlete') then raise exception 'Invalid role'; end if;
  if v_athlete is not null and not exists (select 1 from public.shared_athletes where id = v_athlete and group_id = p_group and user_id is null) then
    raise exception 'Access denied';
  end if;
  update public.shared_group_invitations set status = 'revoked' where group_id = p_group and lower(email) = v_email and status = 'pending';
  insert into public.shared_group_invitations (group_id, group_name, email, role, athlete_id, invited_by)
  select p_group, g.name, v_email, p_role, case when p_role = 'athlete' then v_athlete end, auth.uid() from public.shared_groups g where g.id = p_group
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.shared_answer_invitation(p_invitation uuid, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare inv public.shared_group_invitations; v_name text;
begin
  select * into inv from public.shared_group_invitations where id = p_invitation for update;
  if not found or lower(inv.email) <> public.appletics_auth_email() then raise exception 'Access denied'; end if;
  if inv.status <> 'pending' or inv.expires_at <= now() then raise exception 'Invitation expired'; end if;
  if not p_accept then
    update public.shared_group_invitations set status = 'declined' where id = inv.id;
    return;
  end if;
  v_name := coalesce(public.appletics_display_name(auth.uid()), 'Membre');
  insert into public.shared_group_members (group_id, user_id, role, display_name)
  values (inv.group_id, auth.uid(), inv.role, v_name)
  on conflict (group_id, user_id) do update set role = case when shared_group_members.role = 'coach' then 'coach' else excluded.role end;
  if inv.role = 'athlete' then
    if inv.athlete_id is not null then
      update public.shared_athletes set user_id = auth.uid() where id = inv.athlete_id and user_id is null;
    elsif not exists (select 1 from public.shared_athletes where group_id = inv.group_id and user_id = auth.uid()) then
      insert into public.shared_athletes (group_id, user_id, name) values (inv.group_id, auth.uid(), v_name);
    end if;
  end if;
  update public.shared_group_invitations set status = 'accepted' where id = inv.id;
end; $$;

create or replace function public.shared_add_athlete(p_group uuid, p_name text, p_source text default null) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.appletics_is_group_coach(p_group) then raise exception 'Access denied'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 120 then raise exception 'Invalid name'; end if;
  insert into public.shared_athletes (group_id, name, source_id) values (p_group, btrim(p_name), p_source) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.shared_revoke_invitation(p_invitation uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from public.shared_group_invitations where id = p_invitation;
  if v_group is null or not public.appletics_is_group_coach(v_group) then raise exception 'Access denied'; end if;
  update public.shared_group_invitations set status = 'revoked' where id = p_invitation and status = 'pending';
end; $$;

create or replace function public.shared_remove_member(p_group uuid, p_user uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.appletics_is_group_coach(p_group) or p_user = auth.uid()) then raise exception 'Access denied'; end if;
  if exists (select 1 from public.shared_groups where id = p_group and owner_id = p_user) then raise exception 'Access denied'; end if;
  delete from public.shared_group_members where group_id = p_group and user_id = p_user;
  update public.shared_athletes set user_id = null where group_id = p_group and user_id = p_user;
end; $$;

create or replace function public.shared_publish_session(p_group uuid, p_title text, p_date date, p_details text, p_source text default null) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.appletics_is_group_coach(p_group) then raise exception 'Access denied'; end if;
  if p_source is not null then
    update public.shared_sessions set title = btrim(p_title), session_date = p_date, details = coalesce(p_details, ''), updated_at = now()
     where group_id = p_group and source_key = p_source returning id into v_id;
    if v_id is not null then return v_id; end if;
  end if;
  insert into public.shared_sessions (group_id, title, session_date, details, source_key, created_by)
  values (p_group, btrim(p_title), p_date, coalesce(p_details, ''), p_source, auth.uid()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.shared_save_performance(p_session uuid, p_athlete uuid, p_date date, p_metrics jsonb, p_notes text, p_version integer default 0)
returns public.shared_performances language plpgsql security definer set search_path = public as $$
declare s public.shared_sessions; a public.shared_athletes; r public.shared_performances;
begin
  select * into s from public.shared_sessions where id = p_session;
  select * into a from public.shared_athletes where id = p_athlete;
  if s.id is null or a.id is null or a.group_id <> s.group_id then raise exception 'Access denied'; end if;
  if not (public.appletics_is_group_coach(s.group_id) or (a.user_id = auth.uid() and public.appletics_is_group_member(s.group_id))) then raise exception 'Access denied'; end if;
  if jsonb_typeof(p_metrics) <> 'array' or jsonb_array_length(p_metrics) not between 1 and 30 then raise exception 'Invalid metrics'; end if;
  if coalesce(p_version, 0) = 0 then
    insert into public.shared_performances (group_id, session_id, athlete_id, performed_on, metrics, notes, created_by, updated_by)
    values (s.group_id, s.id, a.id, p_date, p_metrics, coalesce(p_notes, ''), auth.uid(), auth.uid())
    on conflict (session_id, athlete_id) do nothing returning * into r;
    if r.id is null then raise exception 'Performance changed'; end if;
  else
    update public.shared_performances
       set performed_on = p_date, metrics = p_metrics, notes = coalesce(p_notes, ''), updated_by = auth.uid(), version = version + 1, updated_at = now()
     where session_id = s.id and athlete_id = a.id and version = p_version returning * into r;
    if r.id is null then raise exception 'Performance changed'; end if;
  end if;
  return r;
end; $$;

create or replace function public.shared_delete_performance(p_id uuid, p_version integer) returns void language plpgsql security definer set search_path = public as $$
declare r public.shared_performances;
begin
  select * into r from public.shared_performances where id = p_id;
  if r.id is null then raise exception 'Performance changed'; end if;
  if not (public.appletics_is_group_coach(r.group_id)
          or exists (select 1 from public.shared_athletes a where a.id = r.athlete_id and a.user_id = auth.uid())) then raise exception 'Access denied'; end if;
  delete from public.shared_performances where id = p_id and version = p_version;
  if not found then raise exception 'Performance changed'; end if;
end; $$;

do $$ declare f text; begin
  foreach f in array array['shared_create_group(text)','shared_invite(uuid,text,text,text)','shared_answer_invitation(uuid,boolean)',
    'shared_add_athlete(uuid,text,text)','shared_revoke_invitation(uuid)','shared_remove_member(uuid,uuid)',
    'shared_publish_session(uuid,text,date,text,text)','shared_save_performance(uuid,uuid,date,jsonb,text,integer)','shared_delete_performance(uuid,integer)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

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

-- ---------------------------------------------------------------------
-- 4. Messagerie de groupe (signalement + blocage : exigence App Store)
-- ---------------------------------------------------------------------
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender_name text not null default '' check (char_length(sender_name) <= 120),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_created_idx on public.group_messages (group_id, created_at desc);

create table if not exists public.group_message_reads (
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.group_messages enable row level security;
alter table public.group_message_reads enable row level security;
alter table public.message_reports enable row level security;
alter table public.user_blocks enable row level security;

drop policy if exists "group_messages_select_members" on public.group_messages;
create policy "group_messages_select_members" on public.group_messages for select to authenticated
  using (public.appletics_is_group_member(group_id)
         and not exists (select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = sender_id));
drop policy if exists "group_messages_insert_members" on public.group_messages;
create policy "group_messages_insert_members" on public.group_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.appletics_is_group_member(group_id));
drop policy if exists "group_messages_delete_own" on public.group_messages;
create policy "group_messages_delete_own" on public.group_messages for delete to authenticated using (sender_id = auth.uid());

drop policy if exists "group_message_reads_own" on public.group_message_reads;
create policy "group_message_reads_own" on public.group_message_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.appletics_is_group_member(group_id));

drop policy if exists "message_reports_insert_members" on public.message_reports;
create policy "message_reports_insert_members" on public.message_reports for insert to authenticated
  with check (reporter_id = auth.uid()
              and exists (select 1 from public.group_messages gm where gm.id = message_id and public.appletics_is_group_member(gm.group_id)));
drop policy if exists "message_reports_select_own" on public.message_reports;
create policy "message_reports_select_own" on public.message_reports for select to authenticated using (reporter_id = auth.uid());

drop policy if exists "user_blocks_own" on public.user_blocks;
create policy "user_blocks_own" on public.user_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

grant select, insert, delete on public.group_messages to authenticated;
grant select, insert, update, delete on public.group_message_reads to authenticated;
grant select, insert on public.message_reports to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages') then
    execute 'alter publication supabase_realtime add table public.group_messages';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5. Abonnements Stripe (écrits uniquement par la fonction serveur)
-- ---------------------------------------------------------------------
create table if not exists public.billing_test_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.billing_live_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.billing_test_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text, billing_cycle text, status text not null default 'inactive',
  stripe_subscription_id text, current_period_end timestamptz, cancel_at timestamptz, commitment_end timestamptz,
  cancel_at_period_end boolean not null default false, livemode boolean not null default false, checked_at timestamptz
);
create table if not exists public.stripe_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text, livemode boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text, status text, updated_at timestamptz not null default now()
);
create table if not exists public.billing_payment_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null,
  acquired_at timestamptz not null default now()
);
alter table public.billing_test_accounts enable row level security;
alter table public.billing_live_accounts enable row level security;
alter table public.billing_test_entitlements enable row level security;
alter table public.stripe_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_payment_locks enable row level security;
drop policy if exists "billing_entitlements_own" on public.billing_test_entitlements;
create policy "billing_entitlements_own" on public.billing_test_entitlements for select to authenticated using (user_id = auth.uid());
grant select on public.billing_test_entitlements to authenticated;

-- Verrou anti double paiement (un paiement à la fois par compte, expire après 5 minutes)
create or replace function public.acquire_billing_test_payment_lock(p_user_id uuid, p_token uuid) returns boolean language plpgsql security definer set search_path = public as $$
declare v_token uuid;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  insert into public.billing_payment_locks (user_id, token, acquired_at) values (p_user_id, p_token, now())
  on conflict (user_id) do update set token = excluded.token, acquired_at = excluded.acquired_at
    where billing_payment_locks.acquired_at < now() - interval '5 minutes'
  returning token into v_token;
  return coalesce(v_token = p_token, false);
end; $$;
create or replace function public.release_billing_test_payment_lock(p_user_id uuid, p_token uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  delete from public.billing_payment_locks where user_id = p_user_id and token = p_token;
end; $$;
revoke all on function public.acquire_billing_test_payment_lock(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_billing_test_payment_lock(uuid, uuid) from public, anon, authenticated;
grant execute on function public.acquire_billing_test_payment_lock(uuid, uuid) to service_role;
grant execute on function public.release_billing_test_payment_lock(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------
-- 6. Comptes supprimés : plus aucun accès aux données
-- ---------------------------------------------------------------------
do $$ declare t text; op text; policy_label text; begin
  foreach t in array array['user_profiles','shared_groups','shared_group_members','shared_athletes','shared_group_invitations','shared_sessions',
    'shared_performances','shared_performance_audit','group_messages','group_message_reads','message_reports','user_blocks','billing_test_entitlements'] loop
    foreach op in array array['select','insert','update','delete'] loop
      policy_label := 'authenticated_' || op || '_active_account';
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = policy_label) then
        if op = 'insert' then
          execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (public.appletics_account_active())', policy_label, t);
        elsif op = 'update' then
          execute format('create policy %I on public.%I as restrictive for update to authenticated using (public.appletics_account_active()) with check (public.appletics_account_active())', policy_label, t);
        else
          execute format('create policy %I on public.%I as restrictive for %s to authenticated using (public.appletics_account_active())', policy_label, t, op);
        end if;
      end if;
    end loop;
  end loop;
end $$;

-- Suppression de compte (appelée par la fonction serveur appletics-delete-account)
create or replace function public.appletics_erase_account_data(p_user_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare account_email text; owned_athletes uuid[];
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
  select email into account_email from public.user_profiles where id = p_user_id for update;
  if not found then raise exception 'Account unavailable'; end if;
  select coalesce(array_agg(id), array[]::uuid[]) into owned_athletes from public.shared_athletes where user_id = p_user_id;
  delete from public.shared_performances where athlete_id = any(owned_athletes);
  delete from public.shared_performance_audit where athlete_id = any(owned_athletes);
  delete from public.shared_group_invitations where invited_by = p_user_id or lower(email) = lower(coalesce(account_email, ''));
  delete from public.shared_groups where owner_id = p_user_id;
  delete from public.shared_group_members where user_id = p_user_id;
  update public.shared_athletes set user_id = null, name = 'Athlète supprimé', source_id = null where user_id = p_user_id;
  update public.shared_performances set notes = '' where created_by = p_user_id or updated_by = p_user_id;
  update public.shared_sessions set title = 'Séance partagée', details = '' where created_by = p_user_id;
  update public.shared_performance_audit set actor_id = null, before_data = null, after_data = null where actor_id = p_user_id;
  delete from public.group_messages where sender_id = p_user_id;
  delete from public.group_message_reads where user_id = p_user_id;
  delete from public.user_blocks where blocker_id = p_user_id or blocked_id = p_user_id;
  delete from public.billing_test_entitlements where user_id = p_user_id;
  delete from public.billing_test_accounts where user_id = p_user_id;
  delete from public.billing_live_accounts where user_id = p_user_id;
  delete from public.stripe_entitlements where user_id = p_user_id;
  delete from public.subscriptions where user_id = p_user_id;
  update public.user_profiles set username = null, email = 'deleted+' || p_user_id::text || '@deleted.invalid', appletics_profile = null,
    account_deleted_at = coalesce(account_deleted_at, now()) where id = p_user_id;
end; $$;
revoke all on function public.appletics_erase_account_data(uuid) from public, anon, authenticated;
grant execute on function public.appletics_erase_account_data(uuid) to service_role;

-- Appletics — empêcher de créer un second compte avec une adresse déjà utilisée.
-- L'app appelle cette fonction avant d'envoyer le code d'inscription. Ré-exécutable sans risque.
-- Un compte jamais confirmé (inscription abandonnée) ne compte pas : la personne peut recommencer.
create or replace function public.appletics_email_registered(p_email text) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = lower(btrim(coalesce(p_email, '')))
      and (u.email_confirmed_at is not null or u.last_sign_in_at is not null)
  );
$$;
revoke all on function public.appletics_email_registered(text) from public;
grant execute on function public.appletics_email_registered(text) to anon, authenticated;

-- Fin. Vérification rapide : select count(*) from public.user_profiles;
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
-- Appletics — notifications des messages (web push). Ré-exécutable sans risque.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions_own" on public.push_subscriptions;
create policy "push_subscriptions_own" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subscriptions to authenticated;
