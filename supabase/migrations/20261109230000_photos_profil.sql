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
