create extension if not exists pgcrypto;

create sequence if not exists public.property_reference_seq start with 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name varchar(100),
  last_name varchar(100),
  phone varchar(30),
  avatar_url text,
  job_title varchar(150),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null unique,
  display_name varchar(120) not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

insert into public.roles (name, display_name, description) values
  ('super_admin', 'Super administrateur', 'Accès complet à la plateforme.'),
  ('admin', 'Administrateur', 'Gestion des contenus et des opérations.'),
  ('property_manager', 'Gestionnaire immobilier', 'Gestion des annonces immobilières.'),
  ('architectural_manager', 'Gestionnaire architectural', 'Gestion des plans architecturaux.'),
  ('estimate_manager', 'Gestionnaire des devis', 'Gestion des barèmes et des estimations.'),
  ('content_editor', 'Éditeur de contenu', 'Gestion des contenus du site public.')
on conflict (name) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    join public.roles r on r.id = ur.role_id
    where p.id = (select auth.uid())
      and p.is_active
      and r.name in (
        'super_admin', 'admin', 'property_manager',
        'architectural_manager', 'estimate_manager', 'content_editor'
      )
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_dafs_profile on auth.users;
create trigger on_auth_user_created_dafs_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

create table if not exists public.property_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  slug varchar(120) not null unique,
  description text,
  icon varchar(100),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.property_categories (name, slug, sort_order) values
  ('Appartement', 'appartement', 10),
  ('Maison', 'maison', 20),
  ('Villa', 'villa', 30),
  ('Duplex', 'duplex', 40),
  ('Studio', 'studio', 50),
  ('Parcelle', 'parcelle', 60),
  ('Terrain', 'terrain', 70),
  ('Immeuble', 'immeuble', 80),
  ('Local commercial', 'local-commercial', 90),
  ('Autre', 'autre', 100)
on conflict (slug) do nothing;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  reference varchar(50) not null unique default (
    'DAFS-' || lpad(nextval('public.property_reference_seq')::text, 6, '0')
  ),
  category_id uuid references public.property_categories (id) on delete set null,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  short_description text,
  description text,
  operation_type varchar(30) not null check (
    operation_type in ('short_rental', 'long_rental', 'sale')
  ),
  property_status varchar(30) not null default 'available' check (
    property_status in ('available', 'reserved', 'rented', 'sold', 'unavailable')
  ),
  publication_status varchar(30) not null default 'draft' check (
    publication_status in ('draft', 'pending_review', 'published', 'unpublished', 'archived')
  ),
  country varchar(100),
  province varchar(100),
  city varchar(100),
  municipality varchar(100),
  neighborhood varchar(150),
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  land_area_m2 numeric(12, 2) check (land_area_m2 is null or land_area_m2 > 0),
  living_area_m2 numeric(12, 2) check (living_area_m2 is null or living_area_m2 > 0),
  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  bathrooms smallint check (bathrooms is null or bathrooms >= 0),
  living_rooms smallint check (living_rooms is null or living_rooms >= 0),
  floors smallint check (floors is null or floors >= 0),
  price_amount numeric(15, 2) check (price_amount is null or price_amount >= 0),
  currency char(3),
  pricing_period varchar(20) check (
    pricing_period is null or pricing_period in ('night', 'day', 'week', 'month', 'fixed')
  ),
  deposit_amount numeric(15, 2) check (deposit_amount is null or deposit_amount >= 0),
  is_negotiable boolean not null default false,
  is_featured boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null unique,
  alt_text varchar(250),
  caption text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists property_images_one_primary_idx
  on public.property_images (property_id) where is_primary;
create index if not exists properties_publication_idx
  on public.properties (publication_status, published_at desc)
  where archived_at is null;
create index if not exists properties_operation_city_idx
  on public.properties (operation_type, city)
  where publication_status = 'published' and archived_at is null;
create index if not exists property_images_property_order_idx
  on public.property_images (property_id, sort_order);

create table if not exists public.architectural_plans (
  id uuid primary key default gen_random_uuid(),
  reference varchar(50) not null unique,
  title varchar(200) not null,
  slug varchar(220) not null unique,
  short_description text,
  description text,
  category varchar(120),
  built_area_m2 numeric(12, 2) check (built_area_m2 is null or built_area_m2 > 0),
  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  floors smallint check (floors is null or floors >= 0),
  publication_status varchar(30) not null default 'draft' check (
    publication_status in ('draft', 'pending_review', 'published', 'unpublished', 'archived')
  ),
  preview_storage_path text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference varchar(50) not null unique default (
    'DEM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  property_id uuid references public.properties (id) on delete set null,
  inquiry_type varchar(40) not null check (
    inquiry_type in ('general', 'property', 'visit', 'reservation', 'plan', 'estimate')
  ),
  full_name varchar(150) not null,
  email varchar(255),
  phone varchar(30),
  subject varchar(200),
  message text not null,
  status varchar(30) not null default 'new' check (
    status in ('new', 'in_progress', 'waiting', 'resolved', 'archived')
  ),
  source varchar(50) not null default 'public_site',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint inquiries_contact_required check (
    nullif(trim(email), '') is not null or nullif(trim(phone), '') is not null
  )
);

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.property_categories enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.architectural_plans enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "profiles_read_own_or_admin" on public.profiles;
create policy "profiles_read_own_or_admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
drop policy if exists "roles_admin_read" on public.roles;
create policy "roles_admin_read" on public.roles
  for select to authenticated using (public.is_admin());
drop policy if exists "user_roles_admin_read" on public.user_roles;
create policy "user_roles_admin_read" on public.user_roles
  for select to authenticated using (public.is_admin());

drop policy if exists "categories_public_read_active" on public.property_categories;
create policy "categories_public_read_active" on public.property_categories
  for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "categories_admin_manage" on public.property_categories;
create policy "categories_admin_manage" on public.property_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "properties_public_read_published" on public.properties;
create policy "properties_public_read_published" on public.properties
  for select to anon, authenticated
  using (publication_status = 'published' and archived_at is null or public.is_admin());
drop policy if exists "properties_admin_manage" on public.properties;
create policy "properties_admin_manage" on public.properties
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "property_images_public_read_published" on public.property_images;
create policy "property_images_public_read_published" on public.property_images
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.properties p
      where p.id = property_id and p.publication_status = 'published' and p.archived_at is null
    )
  );
drop policy if exists "property_images_admin_manage" on public.property_images;
create policy "property_images_admin_manage" on public.property_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "plans_public_read_published" on public.architectural_plans;
create policy "plans_public_read_published" on public.architectural_plans
  for select to anon, authenticated
  using (publication_status = 'published' and archived_at is null or public.is_admin());
drop policy if exists "plans_admin_manage" on public.architectural_plans;
create policy "plans_admin_manage" on public.architectural_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiries_admin_manage" on public.inquiries;
create policy "inquiries_admin_manage" on public.inquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.property_categories, public.properties, public.property_images,
  public.architectural_plans to anon, authenticated;
grant insert, update, delete on public.property_categories, public.properties,
  public.property_images, public.architectural_plans to authenticated;
grant usage, select on sequence public.property_reference_seq to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.roles, public.user_roles to authenticated;
grant select, insert, update on public.inquiries to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('architectural-previews', 'architectural-previews', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('architectural-originals', 'architectural-originals', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "property_images_admin_upload" on storage.objects;
create policy "property_images_admin_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-images' and public.is_admin());
drop policy if exists "property_images_admin_update" on storage.objects;
create policy "property_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'property-images' and public.is_admin())
  with check (bucket_id = 'property-images' and public.is_admin());
drop policy if exists "property_images_admin_delete" on storage.objects;
create policy "property_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "plan_previews_admin_upload" on storage.objects;
create policy "plan_previews_admin_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'architectural-previews' and public.is_admin());
drop policy if exists "plan_previews_admin_update" on storage.objects;
create policy "plan_previews_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'architectural-previews' and public.is_admin())
  with check (bucket_id = 'architectural-previews' and public.is_admin());
drop policy if exists "plan_previews_admin_delete" on storage.objects;
create policy "plan_previews_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'architectural-previews' and public.is_admin());

drop policy if exists "plan_originals_admin_upload" on storage.objects;
create policy "plan_originals_admin_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'architectural-originals' and public.is_admin());
drop policy if exists "plan_originals_admin_read" on storage.objects;
create policy "plan_originals_admin_read" on storage.objects
  for select to authenticated using (bucket_id = 'architectural-originals' and public.is_admin());
drop policy if exists "plan_originals_admin_delete" on storage.objects;
create policy "plan_originals_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'architectural-originals' and public.is_admin());
