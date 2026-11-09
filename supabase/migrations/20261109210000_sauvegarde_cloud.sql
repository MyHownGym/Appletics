-- Appletics — sauvegarde en ligne de tout ce que chaque compte crée (plans, compétitions, résultats,
-- athlètes, saisies…). Les données ne dépendent plus d'un seul appareil ou navigateur.
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_workspaces enable row level security;
drop policy if exists user_workspaces_select on public.user_workspaces;
drop policy if exists user_workspaces_insert on public.user_workspaces;
drop policy if exists user_workspaces_update on public.user_workspaces;
drop policy if exists user_workspaces_delete on public.user_workspaces;
create policy user_workspaces_select on public.user_workspaces for select to authenticated using (user_id = auth.uid());
create policy user_workspaces_insert on public.user_workspaces for insert to authenticated with check (user_id = auth.uid());
create policy user_workspaces_update on public.user_workspaces for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_workspaces_delete on public.user_workspaces for delete to authenticated using (user_id = auth.uid());
revoke all on public.user_workspaces from anon;
grant select, insert, update, delete on public.user_workspaces to authenticated;

-- Enregistre la sauvegarde et renvoie l'heure du serveur (sert à savoir quel appareil est à jour).
create or replace function public.appletics_save_workspace(p_data jsonb) returns timestamptz
language plpgsql security invoker set search_path = public as $$
declare v_at timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'Access denied'; end if;
  if pg_column_size(p_data) > 8 * 1024 * 1024 then raise exception 'Workspace too large'; end if;
  insert into public.user_workspaces (user_id, data, updated_at) values (auth.uid(), p_data, v_at)
  on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at;
  return v_at;
end; $$;
revoke all on function public.appletics_save_workspace(jsonb) from public, anon;
grant execute on function public.appletics_save_workspace(jsonb) to authenticated;

notify pgrst, 'reload schema';
