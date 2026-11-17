-- Add public-facing copy only where the administrator has not already entered content.
update public.service_pages
set
  body = case
    when nullif(btrim(body), '') is null and slug = 'demenagement-amenagement' then
      'DAFS Sarlu vous accompagne dans la préparation d’un déménagement et la réflexion autour de l’aménagement de vos espaces. Décrivez les lieux concernés, votre besoin et le résultat recherché afin que l’équipe puisse préciser avec vous le périmètre et les modalités de la demande.'
    when nullif(btrim(body), '') is null and slug = 'cleaner' then
      'Le service Cleaner concerne le nettoyage de logements et d’espaces professionnels. Indiquez le type d’espace, les surfaces concernées et votre besoin dans votre demande ; le périmètre et les modalités pourront ensuite être précisés avec DAFS Sarlu.'
    else body
  end,
  features = case
    when coalesce(features, '[]'::jsonb) = '[]'::jsonb and slug = 'demenagement-amenagement' then
      '["Préparer l’organisation du déménagement selon le besoin communiqué.", "Réfléchir à l’agencement du nouvel espace.", "Préciser le périmètre et les modalités avec DAFS Sarlu."]'::jsonb
    when coalesce(features, '[]'::jsonb) = '[]'::jsonb and slug = 'cleaner' then
      '["Nettoyage de logements.", "Nettoyage d’espaces professionnels.", "Périmètre et modalités définis avec l’équipe selon la demande."]'::jsonb
    else features
  end
where slug in ('demenagement-amenagement', 'cleaner');

update public.site_settings
set settings = settings || jsonb_build_object(
  'company_name', coalesce(nullif(settings->>'company_name', ''), 'DAFS Sarlu'),
  'legal_name', coalesce(nullif(settings->>'legal_name', ''), 'DAFS Sarlu'),
  'description', coalesce(nullif(settings->>'description', ''), 'Locations, maisons et parcelles à vendre, plans architecturaux, déménagement, aménagement et nettoyage proposés par DAFS Sarlu.'),
  'email', coalesce(nullif(settings->>'email', ''), 'dafssarlu@gmail.com'),
  'phone', coalesce(nullif(settings->>'phone', ''), ''),
  'whatsapp', coalesce(nullif(settings->>'whatsapp', ''), ''),
  'address', coalesce(nullif(settings->>'address', ''), 'Kinshasa, République démocratique du Congo'),
  'about_title', coalesce(nullif(settings->>'about_title', ''), 'À propos de DAFS Sarlu'),
  'about_content', coalesce(nullif(settings->>'about_content', ''), concat('DAFS Sarlu réunit des services immobiliers et d’accompagnement de projets : locations, biens à vendre, plans architecturaux, déménagement et aménagement, ainsi que le service Cleaner pour le nettoyage de logements et d’espaces professionnels.', chr(10), chr(10), 'Le site présente les biens, plans et services publiés par l’équipe. Les informations détaillées d’un bien ou d’une prestation se confirment directement auprès de DAFS Sarlu avant toute décision.', chr(10), chr(10), 'Vous pouvez parcourir les offres disponibles, consulter les fiches de services et transmettre une demande depuis la page Contact.')),
  'legal_content', coalesce(nullif(settings->>'legal_content', ''), concat('Éditeur du site : DAFS Sarlu.', chr(10), chr(10), 'Contact : dafssarlu@gmail.com.', chr(10), 'Adresse indiquée : Kinshasa, R.D. Congo.', chr(10), chr(10), 'Les informations d’immatriculation de l’entreprise, le responsable de publication et les coordonnées de l’hébergeur doivent être complétés par DAFS Sarlu.', chr(10), chr(10), 'Les contenus concernant les biens et services sont publiés à titre informatif. Leur disponibilité, leurs caractéristiques et leurs modalités doivent être confirmées auprès de DAFS Sarlu. Toute estimation de construction communiquée après étude reste indicative et ne constitue pas un devis contractuel.')),
  'home_title', coalesce(nullif(settings->>'home_title', ''), concat('DAFS Sarlu', chr(10), 'Au service de vos projets')),
  'home_intro', coalesce(nullif(settings->>'home_intro', ''), 'Immobilier, plans architecturaux, déménagement, aménagement et nettoyage : découvrez les services DAFS Sarlu et échangez avec l’équipe autour de votre projet.')
),
updated_at = now()
where id = 'global';
