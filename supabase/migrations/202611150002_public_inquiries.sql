grant insert (inquiry_type, full_name, email, phone, subject, message)
  on public.inquiries to anon, authenticated;

drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert" on public.inquiries
  for insert to anon, authenticated
  with check (
    status = 'new'
    and source = 'public_site'
    and length(trim(full_name)) between 1 and 150
    and length(trim(message)) between 1 and 5000
    and length(coalesce(email, '')) <= 255
    and length(coalesce(phone, '')) <= 30
    and length(coalesce(subject, '')) <= 200
    and (nullif(trim(email), '') is not null or nullif(trim(phone), '') is not null)
  );
