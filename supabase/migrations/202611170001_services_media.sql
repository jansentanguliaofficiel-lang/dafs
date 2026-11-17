create table if not exists public.service_pages (
  id uuid primary key default gen_random_uuid(),
  slug varchar(100) not null unique,
  title varchar(180) not null,
  eyebrow varchar(180) not null default '',
  summary text not null default '',
  body text not null default '',
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  publication_status varchar(20) not null default 'draft'
    check (publication_status in ('draft', 'published', 'unpublished')),
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.service_pages (id) on delete cascade,
  title varchar(200) not null,
  description text not null default '',
  alt_text varchar(250) not null default '',
  category varchar(30) not null default 'other'
    check (category in ('moving', 'cleaning', 'construction', 'architecture', 'brand', 'other')),
  storage_path text not null unique,
  source_path text not null default '',
  mime_type varchar(120) not null,
  file_size bigint not null default 0 check (file_size >= 0),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_pages_publication_order_idx
  on public.service_pages (publication_status, sort_order, created_at);
create index if not exists media_assets_service_publication_order_idx
  on public.media_assets (service_id, is_published, sort_order, created_at);

drop trigger if exists service_pages_set_updated_at on public.service_pages;
create trigger service_pages_set_updated_at before update on public.service_pages
  for each row execute function public.set_updated_at();

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

alter table public.service_pages enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "service_pages_public_read_published" on public.service_pages;
create policy "service_pages_public_read_published" on public.service_pages
  for select to anon, authenticated
  using (publication_status = 'published' or public.is_admin());
drop policy if exists "service_pages_admin_manage" on public.service_pages;
create policy "service_pages_admin_manage" on public.service_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media_assets_public_read_published" on public.media_assets;
create policy "media_assets_public_read_published" on public.media_assets
  for select to anon, authenticated using (
    is_published and (
      service_id is null or exists (
        select 1 from public.service_pages s
        where s.id = service_id and s.publication_status = 'published'
      )
    ) or public.is_admin()
  );
drop policy if exists "media_assets_admin_manage" on public.media_assets;
create policy "media_assets_admin_manage" on public.media_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.service_pages, public.media_assets to anon, authenticated;
grant insert, update, delete on public.service_pages, public.media_assets to authenticated;

insert into public.service_pages (slug, title, eyebrow, summary, body, features, publication_status, sort_order)
values
  (
    'demenagement-amenagement',
    'Déménagement & aménagement',
    'Déménagement et organisation des espaces',
    'Un accompagnement pour préparer votre déménagement et aménager vos espaces selon vos besoins.',
    '',
    '[]'::jsonb,
    'published',
    10
  ),
  (
    'cleaner',
    'Cleaner',
    'Service de nettoyage',
    'Un service de nettoyage pour vos logements et espaces professionnels.',
    '',
    '[]'::jsonb,
    'published',
    20
  )
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_media_admin_upload" on storage.objects;
create policy "site_media_admin_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "site_media_admin_update" on storage.objects;
create policy "site_media_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());
drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-media' and public.is_admin());
