-- Appletics — rappels de fin d'essai (7 jours et 1 jour avant), envoyés chaque matin.
-- 1) Mémoire des rappels déjà envoyés (un seul envoi par rappel et par compte).
create table if not exists public.trial_reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.trial_reminders enable row level security; -- aucun accès depuis l'app : seule la fonction (service role) écrit ici

-- 2) Planification chaque jour à 8 h UTC (9 h en Suisse l'hiver).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('appletics-trial-reminders') where exists (select 1 from cron.job where jobname = 'appletics-trial-reminders');
select cron.schedule('appletics-trial-reminders', '0 8 * * *', $$
  select net.http_post(
    url := 'https://utfyabkxzpmigvjxuusm.supabase.co/functions/v1/appletics-trial-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'VOTRE-CRON-SECRET'),
    body := '{}'::jsonb
  );
$$);
