-- Appletics — retirer un athlète d'un groupe, réactions emoji, images et fichiers dans les discussions.

-- 1. Retirer un athlète d'un groupe (coachs du groupe). Ses séances envoyées dans ce groupe sont retirées.
create or replace function public.shared_remove_athlete(p_athlete uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_group uuid; v_user uuid;
begin
  select group_id, user_id into v_group, v_user from public.shared_athletes where id = p_athlete;
  if v_group is null or not public.appletics_is_group_coach(v_group) then raise exception 'Access denied'; end if;
  delete from public.shared_athletes where id = p_athlete;
  if v_user is not null and not exists (select 1 from public.shared_athletes where group_id = v_group and user_id = v_user) then
    delete from public.shared_group_members where group_id = v_group and user_id = v_user and role = 'athlete';
  end if;
  update public.shared_group_invitations set status = 'revoked' where athlete_id = p_athlete and status = 'pending';
end; $$;
revoke all on function public.shared_remove_athlete(uuid) from public, anon;
grant execute on function public.shared_remove_athlete(uuid) to authenticated;

-- 2. Réactions (une par personne et par message, comme WhatsApp).
create table if not exists public.group_message_reactions (
  message_id uuid not null references public.group_messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.group_message_reactions enable row level security;
drop policy if exists group_message_reactions_select on public.group_message_reactions;
drop policy if exists group_message_reactions_write on public.group_message_reactions;
create policy group_message_reactions_select on public.group_message_reactions for select to authenticated
  using (exists (select 1 from public.group_messages m where m.id = message_id and public.appletics_is_group_member(m.group_id)));
create policy group_message_reactions_write on public.group_message_reactions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.group_messages m where m.id = message_id and public.appletics_is_group_member(m.group_id)));
grant select, insert, update, delete on public.group_message_reactions to authenticated;

-- 3. Pièces jointes (image ou fichier) : texte facultatif quand un fichier est joint.
alter table public.group_messages add column if not exists attachment_path text;
alter table public.group_messages add column if not exists attachment_name text;
alter table public.group_messages add column if not exists attachment_type text;
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid = 'public.group_messages'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%body%' loop
    execute format('alter table public.group_messages drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.group_messages add constraint group_messages_body_or_file check (
  char_length(body) <= 2000 and (char_length(btrim(body)) >= 1 or attachment_path is not null));
alter table public.group_messages drop constraint if exists group_messages_attachment_path_check;
alter table public.group_messages add constraint group_messages_attachment_path_check check (
  attachment_path is null or (attachment_path like group_id::text || '/%' and char_length(attachment_path) <= 300));

-- Stockage privé : seuls les membres du groupe (dossier = id du groupe) lisent et ajoutent des fichiers (20 Mo max).
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists chat_files_read on storage.objects;
drop policy if exists chat_files_upload on storage.objects;
create policy chat_files_read on storage.objects for select to authenticated
  using (bucket_id = 'chat-files' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and public.appletics_is_group_member(((storage.foldername(name))[1])::uuid));
create policy chat_files_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and public.appletics_is_group_member(((storage.foldername(name))[1])::uuid));

notify pgrst, 'reload schema';
