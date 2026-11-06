-- Appletics — messagerie de groupe en ligne
-- Chaque groupe partagé (shared_groups) dispose d'une discussion commune à tous ses membres
-- (shared_group_members). Seuls les membres du groupe lisent et écrivent ; un membre peut
-- signaler un message et bloquer un autre utilisateur (exigence App Store pour le contenu utilisateur).

-- Membre du groupe ? (security definer : évite la récursion des règles RLS sur shared_group_members)
create or replace function public.appletics_is_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shared_group_members m
    where m.group_id = p_group and m.user_id = auth.uid()
  );
$$;
revoke all on function public.appletics_is_group_member(uuid) from public;
grant execute on function public.appletics_is_group_member(uuid) to authenticated;

-- Messages
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender_name text not null default '' check (char_length(sender_name) <= 120),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists group_messages_group_created_idx on public.group_messages (group_id, created_at desc);
alter table public.group_messages enable row level security;

drop policy if exists "group_messages_select_members" on public.group_messages;
create policy "group_messages_select_members" on public.group_messages
  for select to authenticated
  using (public.appletics_is_group_member(group_id));

drop policy if exists "group_messages_insert_members" on public.group_messages;
create policy "group_messages_insert_members" on public.group_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.appletics_is_group_member(group_id));

drop policy if exists "group_messages_delete_own" on public.group_messages;
create policy "group_messages_delete_own" on public.group_messages
  for delete to authenticated
  using (sender_id = auth.uid());

-- Dernière lecture (pastille « non lu »)
create table if not exists public.group_message_reads (
  group_id uuid not null references public.shared_groups(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_message_reads enable row level security;
drop policy if exists "group_message_reads_own" on public.group_message_reads;
create policy "group_message_reads_own" on public.group_message_reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.appletics_is_group_member(group_id));

-- Signalements
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);
alter table public.message_reports enable row level security;
drop policy if exists "message_reports_insert_members" on public.message_reports;
create policy "message_reports_insert_members" on public.message_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (select 1 from public.group_messages gm where gm.id = message_id and public.appletics_is_group_member(gm.group_id))
  );
drop policy if exists "message_reports_select_own" on public.message_reports;
create policy "message_reports_select_own" on public.message_reports
  for select to authenticated
  using (reporter_id = auth.uid());

-- Blocages entre utilisateurs
create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "user_blocks_own" on public.user_blocks;
create policy "user_blocks_own" on public.user_blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- Messages masqués : un message d'un utilisateur bloqué n'est plus renvoyé à celui qui l'a bloqué
drop policy if exists "group_messages_select_members" on public.group_messages;
create policy "group_messages_select_members" on public.group_messages
  for select to authenticated
  using (
    public.appletics_is_group_member(group_id)
    and not exists (select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = sender_id)
  );

-- Temps réel : diffuser les nouveaux messages aux membres connectés (les règles RLS s'appliquent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.group_messages';
  end if;
end $$;

grant select, insert, delete on public.group_messages to authenticated;
grant select, insert, update, delete on public.group_message_reads to authenticated;
grant select, insert on public.message_reports to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
