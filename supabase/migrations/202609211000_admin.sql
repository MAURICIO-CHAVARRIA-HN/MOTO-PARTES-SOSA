-- Admin-phase indexes: keep queries for the private panel fast without
-- exposing new data. Run on the same project as the initial migration.
begin;

create index products_published on public.products(published);
create index products_review_status on public.products(source_review_status);
create index products_featured_published on public.products(featured)
  where published and source_review_status in ('manual','approved');

commit;