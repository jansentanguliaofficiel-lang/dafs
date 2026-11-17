-- Remove the retired public contact number without overwriting other settings.
update public.site_settings
set settings = settings || jsonb_build_object(
  'phone', case
    when position(concat('243', '838', '755', '731') in regexp_replace(coalesce(settings->>'phone', ''), '\D', '', 'g')) > 0 then ''
    else coalesce(settings->>'phone', '')
  end,
  'whatsapp', case
    when position(concat('243', '838', '755', '731') in regexp_replace(coalesce(settings->>'whatsapp', ''), '\D', '', 'g')) > 0 then ''
    else coalesce(settings->>'whatsapp', '')
  end,
  'legal_content', regexp_replace(
    regexp_replace(coalesce(settings->>'legal_content', ''), 'https?://wa\.me/\d+', '', 'gi'),
    concat('\+?', '243', '\s*', '838', '\s*', '755', '\s*', '731'),
    '',
    'g'
  ),
  'about_title', case
    when settings->>'about_title' = 'DAFS Sarlu | Immobilier et architecture' then 'À propos de DAFS Sarlu'
    else coalesce(settings->>'about_title', 'À propos de DAFS Sarlu')
  end,
  'about_content', case
    when coalesce(settings->>'about_content', '') like '%(année de création)%' then settings->>'about_content'
    else concat_ws(chr(10) || chr(10),
      nullif(settings->>'about_content', ''),
      'DAFS Sarlu a été créée en (année de création). L’entreprise est portée par (nom ou présentation du fondateur et de l’équipe) et s’appuie sur (expérience, compétences ou partenariats à préciser).',
      'Notre mission est de (mission de l’entreprise à compléter). Notre vision pour les prochaines années est de (ambition ou vision à compléter).',
      'DAFS Sarlu intervient à Kinshasa, notamment à (communes et quartiers effectivement desservis). Pour une demande située ailleurs, l’équipe confirme au cas par cas sa capacité à intervenir.',
      'Pour chaque demande, nous nous engageons à (engagements vérifiables à préciser : délais de réponse, suivi, qualité ou transparence). Les modalités, les délais et le périmètre sont confirmés avant le démarrage de toute prestation.'
    )
  end
),
updated_at = now()
where id = 'global';
