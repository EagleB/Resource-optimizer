create extension if not exists pgcrypto;

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  draft_payload jsonb not null,
  published_payload jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, week_start)
);

create table public.week_assignments (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  recipient_email text not null check (recipient_email = lower(trim(recipient_email))),
  person_name text not null,
  assignment_payload jsonb not null,
  published_at timestamptz not null,
  notification_status text not null default 'pending' check (notification_status in ('pending','sent','failed')),
  notification_error text,
  notified_at timestamptz,
  unique (week_id, recipient_email)
);

create index weeks_owner_recent_idx on public.weeks (owner_id, week_start desc);
create index week_assignments_recipient_idx on public.week_assignments (recipient_email, published_at desc);
create index week_assignments_retry_idx on public.week_assignments (week_id, notification_status) where notification_status = 'failed';

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.gmail_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sender_email text not null,
  encrypted_refresh_token text not null,
  token_iv text not null,
  token_tag text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.gmail_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_url text not null,
  expires_at timestamptz not null default now() + interval '10 minutes'
);

alter table public.weeks enable row level security;
alter table public.week_assignments enable row level security;

create policy "owners read weeks" on public.weeks for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "owners create weeks" on public.weeks for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "owners update weeks" on public.weeks for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "owners delete weeks" on public.weeks for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "owners or assigned recipients read assignments" on public.week_assignments for select to authenticated
  using (
    (select auth.uid()) = owner_id
    or recipient_email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
create policy "owners create assignments" on public.week_assignments for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "owners update assignments" on public.week_assignments for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "owners delete assignments" on public.week_assignments for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.weeks, public.week_assignments from anon;
grant select, insert, update, delete on public.weeks to authenticated;
grant select, insert, update, delete on public.week_assignments to authenticated;

create or replace function public.publish_week_snapshot(
  target_week_id uuid,
  snapshot jsonb,
  assignments jsonb
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  published_time timestamptz := now();
  assignment jsonb;
  inserted_count integer := 0;
begin
  update public.weeks
     set published_payload = snapshot, published_at = published_time
   where id = target_week_id and owner_id = caller;
  if not found then raise exception 'Week not found or not owned by caller'; end if;

  delete from public.week_assignments where week_id = target_week_id and owner_id = caller;
  for assignment in select value from jsonb_array_elements(assignments)
  loop
    insert into public.week_assignments
      (week_id, owner_id, week_start, recipient_email, person_name, assignment_payload, published_at)
    values
      (target_week_id, caller, (snapshot #>> '{settings,weekLabel}')::date,
       lower(trim(assignment->>'recipient_email')), assignment->>'person_name',
       assignment->'assignment_payload', published_time);
    inserted_count := inserted_count + 1;
  end loop;
  return inserted_count;
end;
$$;

revoke all on function public.publish_week_snapshot(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.publish_week_snapshot(uuid,jsonb,jsonb) to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weeks_set_updated_at before update on public.weeks
for each row execute function private.set_updated_at();

create trigger gmail_connections_set_updated_at before update on private.gmail_connections
for each row execute function private.set_updated_at();

create or replace function public.service_gmail_connection(target_user uuid)
returns table(sender_email text, encrypted_refresh_token text, token_iv text, token_tag text, connected_at timestamptz)
language sql security definer set search_path = '' stable as $$
  select g.sender_email, g.encrypted_refresh_token, g.token_iv, g.token_tag, g.connected_at
  from private.gmail_connections g where g.user_id = target_user;
$$;

create or replace function public.service_upsert_gmail_connection(
  target_user uuid, sender text, encrypted_token text, iv text, tag text
) returns void language sql security definer set search_path = '' as $$
  insert into private.gmail_connections(user_id,sender_email,encrypted_refresh_token,token_iv,token_tag)
  values(target_user,lower(sender),encrypted_token,iv,tag)
  on conflict(user_id) do update set sender_email=excluded.sender_email,
    encrypted_refresh_token=excluded.encrypted_refresh_token,token_iv=excluded.token_iv,token_tag=excluded.token_tag;
$$;

create or replace function public.service_update_gmail_sender(target_user uuid, sender text)
returns void language sql security definer set search_path = '' as $$
  update private.gmail_connections set sender_email=lower(sender) where user_id=target_user;
$$;

create or replace function public.service_delete_gmail_connection(target_user uuid)
returns void language sql security definer set search_path = '' as $$
  delete from private.gmail_connections where user_id=target_user;
$$;

create or replace function public.service_create_gmail_state(target_hash text,target_user uuid,target_app_url text)
returns void language sql security definer set search_path = '' as $$
  delete from private.gmail_oauth_states where expires_at <= now() or user_id=target_user;
  insert into private.gmail_oauth_states(state_hash,user_id,app_url) values(target_hash,target_user,target_app_url);
$$;

create or replace function public.service_consume_gmail_state(target_hash text)
returns table(user_id uuid,app_url text) language plpgsql security definer set search_path = '' as $$
begin
  return query delete from private.gmail_oauth_states s
    where s.state_hash=target_hash and s.expires_at>now()
    returning s.user_id,s.app_url;
end;
$$;

revoke all on function public.service_gmail_connection(uuid) from public,anon,authenticated;
revoke all on function public.service_upsert_gmail_connection(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.service_update_gmail_sender(uuid,text) from public,anon,authenticated;
revoke all on function public.service_delete_gmail_connection(uuid) from public,anon,authenticated;
revoke all on function public.service_create_gmail_state(text,uuid,text) from public,anon,authenticated;
revoke all on function public.service_consume_gmail_state(text) from public,anon,authenticated;
grant execute on function public.service_gmail_connection(uuid) to service_role;
grant execute on function public.service_upsert_gmail_connection(uuid,text,text,text,text) to service_role;
grant execute on function public.service_update_gmail_sender(uuid,text) to service_role;
grant execute on function public.service_delete_gmail_connection(uuid) to service_role;
grant execute on function public.service_create_gmail_state(text,uuid,text) to service_role;
grant execute on function public.service_consume_gmail_state(text) to service_role;
