-- Appletics — un appareil reçoit les notifications du compte connecté dessus.
-- (Si deux comptes se sont connectés sur le même téléphone, le dernier connecté récupère les notifications.)
create or replace function public.appletics_claim_push(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Access denied'; end if;
  if coalesce(p_endpoint, '') !~ '^https://' or char_length(p_endpoint) > 1000 or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then raise exception 'Invalid subscription'; end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_user_agent, ''), 200))
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent;
end; $$;
revoke all on function public.appletics_claim_push(text, text, text, text) from public, anon;
grant execute on function public.appletics_claim_push(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
