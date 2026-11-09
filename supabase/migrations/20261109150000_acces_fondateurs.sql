-- Appletics — accès offerts aux coachs fondateurs (sans paiement).
-- Ajouter un coach : Supabase > Table Editor > appletics_founder_access > Insert row
--   email      : son adresse de connexion (en minuscules)
--   tier       : basic, pro, elite, club_basic, club_pro ou club_elite
--   expires_at : date de fin (vide = à vie)
-- ou en SQL :
--   insert into public.appletics_founder_access (email, tier, note) values ('coach@exemple.ch', 'elite', 'Coach fondateur');
create table if not exists public.appletics_founder_access (
  email text primary key,
  tier text not null default 'elite',
  expires_at date,
  note text,
  created_at timestamptz not null default now()
);
alter table public.appletics_founder_access drop constraint if exists appletics_founder_access_tier_check;
alter table public.appletics_founder_access add constraint appletics_founder_access_tier_check
  check (tier in ('basic', 'pro', 'elite', 'club_basic', 'club_pro', 'club_elite'));
-- Adresse toujours enregistrée en minuscules, même si elle est saisie avec des majuscules.
create or replace function public.appletics_founder_email_lower() returns trigger language plpgsql as $$
begin new.email := lower(btrim(new.email)); return new; end; $$;
drop trigger if exists appletics_founder_email_lower on public.appletics_founder_access;
create trigger appletics_founder_email_lower before insert or update on public.appletics_founder_access
  for each row execute function public.appletics_founder_email_lower();
-- Lecture réservée au serveur (fonction appletics-billing) : aucune politique pour les utilisateurs.
alter table public.appletics_founder_access enable row level security;
revoke all on public.appletics_founder_access from anon, authenticated;
