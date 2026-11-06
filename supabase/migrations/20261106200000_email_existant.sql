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
