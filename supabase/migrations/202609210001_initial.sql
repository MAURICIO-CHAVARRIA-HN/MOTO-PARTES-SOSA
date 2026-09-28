-- Initial schema; run in a project owned by Rancing Mau.
begin;

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  role text not null default 'admin' check (role = 'admin'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.is_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (select 1 from public.admin_users where id = auth.uid() and active and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), active boolean not null default true
);
create table public.brands (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), active boolean not null default true
);
create table public.branches (
  id uuid primary key default gen_random_uuid(), name text not null,
  slug text not null unique, address text, reference text, city text not null,
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$'),
  phone text, schedule text,
  google_maps_url text check (google_maps_url is null or google_maps_url ~ '^https://'),
  map_embed_url text check (map_embed_url is null or map_embed_url ~ '^https://'),
  active boolean not null default true
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique check (length(sku) between 1 and 60),
  description text not null default '' check (length(description) <= 5000),
  base_price numeric(12,2) check (base_price >= 0),
  promo_price numeric(12,2) check (promo_price >= 0),
  price_country text not null default 'HN' check (price_country = 'HN'),
  source_url text check (source_url is null or source_url ~ '^https://'), source_name text, source_checked_at timestamptz,
  source_review_status text not null default 'manual' check (source_review_status in ('manual','pending','approved','rejected')),
  source_reviewed_by uuid references public.admin_users(id), source_reviewed_at timestamptz,
  category_id uuid not null references public.categories(id), brand_id uuid not null references public.brands(id),
  general_status text not null default 'available' check (general_status in ('available','out_of_stock','promotion')),
  featured boolean not null default false, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (promo_price is null or (base_price is not null and promo_price < base_price)),
  check (general_status <> 'promotion' or promo_price is not null),
  check (not published or (source_review_status in ('manual','approved') and base_price is not null)),
  check (source_url is null or (source_name is not null and source_checked_at is not null and source_review_status <> 'manual')),
  check (source_review_status <> 'approved' or (source_url is not null and source_reviewed_by is not null and source_reviewed_at is not null))
);
create table public.product_images (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (url ~ '^(/images/|https://)'), source_url text,
  license_or_permission text, alt_text text not null,
  position integer not null default 0 check (position >= 0), is_primary boolean not null default false
);
create unique index product_one_primary_image on public.product_images(product_id) where is_primary;
create table public.product_branches (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  available boolean not null default false, status text not null default 'out_of_stock' check (status in ('available','out_of_stock','promotion')),
  branch_price numeric(12,2) check (branch_price >= 0), branch_promo_price numeric(12,2) check (branch_promo_price >= 0),
  updated_at timestamptz not null default now(), unique(product_id,branch_id),
  check (branch_promo_price is null or (branch_price is not null and branch_promo_price < branch_price)),
  check ((available and status in ('available','promotion')) or (not available and status = 'out_of_stock'))
);
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null, record_id uuid not null, action text not null,
  created_at timestamptz not null default now()
);
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create function public.audit_admin_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_audit_log(actor_id,table_name,record_id,action)
  values(auth.uid(),tg_table_name,case when tg_op = 'DELETE' then old.id else new.id end,tg_op);
  return null;
end;
$$;
revoke all on function public.audit_admin_change() from public;

do $$ declare t text; begin
  foreach t in array array['admin_users','products','product_branches'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
  foreach t in array array['products','product_images','product_branches','categories','brands','branches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.audit_admin_change()', t);
  end loop;
end $$;
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;
-- Users cannot promote themselves; initial membership is assigned via SQL by the owner.
create policy admin_read_self on public.admin_users for select to authenticated using (id = auth.uid());
create policy admin_read_audit on public.admin_audit_log for select to authenticated using (public.is_admin());
create policy public_active_branches on public.branches for select to anon using (active);

-- Intentionally owner-executed view with fixed projection + mandatory public filters.
-- Raw product tables are inaccessible to anon; source/reviewer fields are never projected.
create view public.public_catalog with (security_barrier = true) as
select p.id,p.slug,p.name,p.sku,p.description,p.base_price,p.promo_price,p.general_status,p.featured,
  b.name as brand,c.name as category,
  (select i.url from public.product_images i where i.product_id = p.id order by i.is_primary desc,i.position,i.id limit 1) as image,
  coalesce((select jsonb_agg(jsonb_build_object('branch_id',pb.branch_id,'available',pb.available,'branch_price',pb.branch_price,'branch_promo_price',pb.branch_promo_price))
    from public.product_branches pb join public.branches br on br.id = pb.branch_id and br.active where pb.product_id = p.id), '[]'::jsonb) as branches
from public.products p
join public.brands b on b.id = p.brand_id and b.active
join public.categories c on c.id = p.category_id and c.active
where p.published and p.source_review_status in ('manual','approved') and p.base_price is not null
  and exists(select 1 from public.product_images i where i.product_id = p.id);

revoke all on public.admin_users,public.products,public.product_images,public.product_branches,public.categories,public.brands,public.admin_audit_log from anon;
revoke all on public.admin_users,public.admin_audit_log from authenticated;
grant select on public.admin_users,public.admin_audit_log to authenticated;
grant select,insert,update,delete on public.products,public.product_images,public.product_branches,public.categories,public.brands,public.branches to authenticated;
grant select on public.branches,public.public_catalog to anon;
grant select on public.public_catalog to authenticated;

create index products_category on public.products(category_id);
create index products_brand on public.products(brand_id);
create index product_branches_branch on public.product_branches(branch_id);
create index product_images_product on public.product_images(product_id);

insert into public.branches(id,name,slug,city) values
('00000000-0000-4000-8000-000000000001','LA PAZ TIENDA 1','la-paz-tienda-1','La Paz'),
('00000000-0000-4000-8000-000000000002','LA PAZ TIENDA 2','la-paz-tienda-2','La Paz'),
('00000000-0000-4000-8000-000000000003','MARCALA TIENDA 3','marcala-tienda-3','Marcala');

-- Only approved assets belong in the public bucket. Candidates stay private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('catalog-candidates','catalog-candidates',false,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
('catalog-public','catalog-public',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
create policy admin_catalog_storage on storage.objects for all to authenticated
using (bucket_id in ('catalog-candidates','catalog-public') and public.is_admin())
with check (bucket_id in ('catalog-candidates','catalog-public') and public.is_admin());
commit;
