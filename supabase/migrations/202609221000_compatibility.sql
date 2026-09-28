-- Compatibility database: motorcycles, spare parts and their confirmed links.
-- Data source: KM Motos catalog (https://www.kmmotos.com/), imported via
-- `npm run compat:import`. Admin-only tables; the public catalog never projects them.
begin;

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  km_handle text not null unique check (km_handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 120),
  brand text not null check (length(brand) between 1 and 60),
  model text not null check (length(model) between 1 and 80),
  engine_cc smallint check (engine_cc >= 0),
  year_or_generation text,
  source_url text check (source_url is null or source_url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  km_id bigint not null unique,
  name text not null check (length(name) between 1 and 300),
  code text check (code is null or length(code) between 1 and 80),
  category text not null check (length(category) between 1 and 80),
  brand text check (brand is null or length(brand) between 1 and 80),
  measurements text,
  price_hnl numeric(12,2) check (price_hnl is null or price_hnl >= 0),
  image_url text check (image_url is null or image_url ~ '^https://'),
  source_url text check (source_url is null or source_url ~ '^https://'),
  source_name text,
  source_checked_at date,
  description text check (description is null or length(description) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compatibility (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  motorcycle_id uuid not null references public.motorcycles(id) on delete cascade,
  compatibility_level text not null check (compatibility_level in ('confirmada','probable')),
  reason text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  notes text check (notes is null or length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spare_part_id, motorcycle_id)
);

do $$ declare t text; begin
  foreach t in array array['motorcycles','spare_parts','compatibility'] loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.audit_admin_change()', t);
  end loop;
end $$;

revoke all on public.motorcycles, public.spare_parts, public.compatibility from anon;
grant select,insert,update,delete on public.motorcycles, public.spare_parts, public.compatibility to authenticated;

create index spare_parts_category on public.spare_parts(category);
create index spare_parts_brand on public.spare_parts(brand);
create index compatibility_spare_part on public.compatibility(spare_part_id);
create index compatibility_motorcycle on public.compatibility(motorcycle_id);

commit;