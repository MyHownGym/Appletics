-- Appletics TestFlight: safe account-erasure prerequisites.
-- This migration installs definitions and RLS only; it does not erase existing accounts.
alter table public.user_profiles add column if not exists account_deleted_at timestamptz;
create or replace function public.appletics_account_active() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.user_profiles where id=auth.uid() and account_deleted_at is null);
$$;
revoke all on function public.appletics_account_active() from public,anon;
grant execute on function public.appletics_account_active() to authenticated;
do $$ declare t text; op text; policy_label text; begin
 foreach t in array array['user_profiles','athletes','training_plans','training_sessions','competitions','competition_results','chat_channels','channel_members','chat_messages','subscriptions','billing_test_accounts','billing_test_entitlements','stripe_entitlements','shared_groups','shared_group_members','shared_athletes','shared_group_invitations','shared_sessions','shared_performances','shared_performance_audit'] loop
  foreach op in array array['select','insert','update','delete'] loop
   policy_label := 'authenticated_' || op || '_active_account';
   if not exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname=policy_label) then
    if op='insert' then
     execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (public.appletics_account_active())',policy_label,t);
    elsif op='update' then
     execute format('create policy %I on public.%I as restrictive for update to authenticated using (public.appletics_account_active()) with check (public.appletics_account_active())',policy_label,t);
    else
     execute format('create policy %I on public.%I as restrictive for %s to authenticated using (public.appletics_account_active())',policy_label,t,op);
    end if;
   end if;
  end loop;
 end loop;
end $$;
create or replace function public.shared_audit_performance() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if tg_op='DELETE' then
  if exists(select 1 from public.shared_groups where id=old.group_id) then
   insert into public.shared_performance_audit(group_id,athlete_id,performance_id,action,actor_id,before_data) values(old.group_id,old.athlete_id,old.id,'delete',auth.uid(),to_jsonb(old));
  end if;
  return old;
 else
  insert into public.shared_performance_audit(group_id,athlete_id,performance_id,action,actor_id,before_data,after_data) values(new.group_id,new.athlete_id,new.id,lower(tg_op),auth.uid(),case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
  return new;
 end if;
end; $$;
create or replace function public.appletics_erase_account_data(p_user_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare account_email text; owned_athletes uuid[];
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Server access required'; end if;
 select email into account_email from public.user_profiles where id=p_user_id for update;
 if not found then raise exception 'Account unavailable'; end if;
 select coalesce(array_agg(id),array[]::uuid[]) into owned_athletes from public.shared_athletes where user_id=p_user_id;
 -- User-confirmed erasure of the caller's own data. Other members' contributions retain only anonymous author references.
 delete from public.shared_performances where athlete_id=any(owned_athletes);
 delete from public.shared_performance_audit where athlete_id=any(owned_athletes);
 delete from public.shared_group_invitations where invited_by=p_user_id or lower(email)=lower(account_email);
 delete from public.shared_groups where owner_id=p_user_id;
 delete from public.shared_group_members where user_id=p_user_id;
 update public.shared_athletes set user_id=null,name='Athlète supprimé',source_id=null where user_id=p_user_id;
 update public.shared_performances set notes='' where created_by=p_user_id or updated_by=p_user_id;
 update public.shared_sessions set title='Séance partagée',details='' where created_by=p_user_id;
 update public.shared_performance_audit set actor_id=null,before_data=null,after_data=null where actor_id=p_user_id or before_data->>'created_by'=p_user_id::text or before_data->>'updated_by'=p_user_id::text or after_data->>'created_by'=p_user_id::text or after_data->>'updated_by'=p_user_id::text;
 delete from public.chat_messages where sender_id=p_user_id;
 delete from public.channel_members where user_id=p_user_id;
 delete from public.chat_channels where coach_id=p_user_id;
 delete from public.competition_results where coach_id=p_user_id;
 delete from public.competitions where coach_id=p_user_id;
 delete from public.training_sessions where coach_id=p_user_id;
 delete from public.training_plans where coach_id=p_user_id;
 delete from public.athletes where coach_id=p_user_id;
 delete from public.billing_test_entitlements where user_id=p_user_id;
 delete from public.billing_test_accounts where user_id=p_user_id;
 delete from public.stripe_entitlements where user_id=p_user_id;
 delete from public.subscriptions where user_id=p_user_id;
 update public.user_profiles set username=null,email='deleted+' || p_user_id::text || '@deleted.invalid',appletics_profile=null,account_deleted_at=coalesce(account_deleted_at,now()) where id=p_user_id;
end; $$;
revoke all on function public.appletics_erase_account_data(uuid) from public,anon,authenticated;
grant execute on function public.appletics_erase_account_data(uuid) to service_role;
create or replace function public.sync_user_metadata() returns trigger language plpgsql security definer set search_path=public as $$
begin
 update public.user_profiles set username=coalesce(new.raw_user_meta_data->>'username',old.raw_user_meta_data->>'username',split_part(new.email,'@',1)) where id=new.id and account_deleted_at is null;
 return new;
end; $$;
