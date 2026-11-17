create table if not exists public.site_settings (
  id text primary key check (id = 'global'),
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, settings)
values ('global', jsonb_build_object('company_name', 'DAFS Sarlu'))
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select to anon, authenticated using (id = 'global' or public.is_admin());

drop policy if exists "site_settings_admin_manage" on public.site_settings;
create policy "site_settings_admin_manage" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
