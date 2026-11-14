-- Appletics · coachs rattachés à un club (fichier SQL n° 18)
-- Les coachs membres du groupe « Coachs » d'un club profitent de la formule du club.
-- S'ils quittent le club, ils repassent sur leur propre compte coach (Basic, sans nouvel essai).

alter table public.shared_groups add column if not exists club_staff boolean not null default false;
alter table public.user_profiles add column if not exists club_left_at timestamptz;

-- Le propriétaire d'un groupe le marque comme groupe des coachs de son club.
create or replace function public.appletics_mark_club_staff(p_group uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.shared_groups set club_staff = true where id = p_group and owner_id = auth.uid();
  if not found then raise exception 'Access denied'; end if;
end; $$;

-- Formule du club pour le coach connecté (ou null s'il n'est dans aucun club).
-- Ordre : abonnement Stripe actif du club, accès fondateur du club, essai gratuit du club (Club Pro).
create or replace function public.appletics_club_plan() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_group record; v_tier text; v_left timestamptz; v_created timestamptz; v_email text;
  v_trial_end timestamptz;
begin
  select club_left_at into v_left from public.user_profiles where id = auth.uid();
  select g.id, g.name, g.owner_id into v_group
    from public.shared_group_members m join public.shared_groups g on g.id = m.group_id
    where m.user_id = auth.uid() and m.role = 'coach' and g.club_staff and g.owner_id <> auth.uid()
    order by g.created_at limit 1;
  if v_group.id is null then return jsonb_build_object('tier', null, 'left_at', v_left); end if;

  select e.tier into v_tier from public.billing_test_entitlements e
    where e.user_id = v_group.owner_id and e.status = 'active' and e.tier like 'club_%'
      and (e.current_period_end is null or e.current_period_end > now());
  if v_tier is null then
    select lower(u.email), u.created_at into v_email, v_created from auth.users u where u.id = v_group.owner_id;
    select f.tier into v_tier from public.appletics_founder_access f
      where lower(f.email) = v_email and f.tier like 'club_%' and (f.expires_at is null or f.expires_at >= current_date);
    if v_tier is null then
      v_trial_end := greatest(v_created, timestamptz '2026-12-01 00:00:00+01') + interval '30 days';
      if v_trial_end > now() then v_tier := 'club_pro'; end if;
    end if;
  end if;
  return jsonb_build_object('tier', v_tier, 'club', regexp_replace(v_group.name, '\s*·\s*Coachs$', ''), 'group_id', v_group.id, 'left_at', v_left);
end; $$;

-- Le coach quitte le club : il sort du groupe des coachs et garde ses propres données.
create or replace function public.appletics_leave_club() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.shared_group_members m using public.shared_groups g
    where g.id = m.group_id and g.club_staff and g.owner_id <> auth.uid() and m.user_id = auth.uid();
  update public.user_profiles set club_left_at = now() where id = auth.uid();
end; $$;

grant execute on function public.appletics_mark_club_staff(uuid) to authenticated;
grant execute on function public.appletics_club_plan() to authenticated;
grant execute on function public.appletics_leave_club() to authenticated;
