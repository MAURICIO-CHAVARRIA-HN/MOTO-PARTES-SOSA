-- Public branch reviews and privacy-preserving aggregate page statistics.
begin;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (length(btrim(comment)) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending','approved','hidden','rejected')),
  admin_response text check (admin_response is null or length(btrim(admin_response)) between 1 and 1200),
  moderation_reason text check (moderation_reason is null or length(btrim(moderation_reason)) between 1 and 500),
  moderated_by uuid references public.admin_users(id) on delete set null,
  moderated_at timestamptz,
  responded_by uuid references public.admin_users(id) on delete set null,
  responded_at timestamptz,
  dedupe_key text not null unique,
  visitor_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_branch_status_created on public.reviews(branch_id, status, created_at desc);
create index reviews_status_created on public.reviews(status, created_at desc);
create index reviews_visitor_created on public.reviews(visitor_token_hash, created_at desc);

create trigger reviews_touch_updated_at before update on public.reviews
for each row execute function public.touch_updated_at();
create trigger reviews_audit after insert or update or delete on public.reviews
for each row execute function public.audit_admin_change();

alter table public.reviews enable row level security;
create policy reviews_admin_manage on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.reviews to authenticated, service_role;

create view public.public_reviews with (security_barrier = true) as
select r.id, r.branch_id, b.name as branch_name, b.slug as branch_slug,
  r.rating, r.comment, r.admin_response, r.created_at, r.responded_at
from public.reviews r
join public.branches b on b.id = r.branch_id
where r.status = 'approved';

revoke all on public.reviews from anon;
revoke all on public.public_reviews from anon;
grant select on public.public_reviews to anon, authenticated;

create table public.page_views_daily (
  day date not null,
  path text not null check (length(path) between 1 and 300 and left(path, 1) = '/' and position('?' in path) = 0),
  views bigint not null default 0 check (views >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, path)
);
alter table public.page_views_daily enable row level security;
create policy page_views_admin_read on public.page_views_daily
  for select to authenticated using (public.is_admin());
revoke all on public.page_views_daily from anon, authenticated;
grant select on public.page_views_daily to authenticated;

create function public.increment_page_view(p_day date, p_path text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if length(p_path) not between 1 and 300 or left(p_path, 1) <> '/' or position('?' in p_path) > 0 or p_path like '/admin%' or p_path like '/api%' then
    return;
  end if;
  insert into public.page_views_daily(day, path, views)
  values (p_day, p_path, 1)
  on conflict (day, path) do update set views = public.page_views_daily.views + 1,
    updated_at = now();
end;
$$;
revoke all on function public.increment_page_view(date, text) from public;
grant execute on function public.increment_page_view(date, text) to service_role;

commit;
