-- Seed the four sale listings provided with the project. The copy stays editable in the admin.
with source_listings as (
  select * from (values
    (
      '00000000-0000-4000-8000-000000000101'::uuid, 'DAFS-BDL-001', 'Maison basse avec parcelle à Bandalungwa', 'maison-basse-parcelle-bandalungwa', 'maison',
      'Maison basse de 3 chambres avec véranda et parking à Bandal Molard.',
      'Parcelle habitable située à Bandal Molard, dans un environnement résidentiel calme et sur une avenue asphaltée. La maison comprend 3 chambres, 2 salles d’eau, une cuisine, un salon spacieux, une véranda et un parking. Dimensions annoncées : 9,30 m × 20 m (environ 186 m²). Prix annoncé : 240 000 USD, à discuter. Repère communiqué : direction Maman Colonel. Adresse exacte à préciser auprès de DAFS Sarlu.',
      'Bandalungwa', 'Bandal Molard', 'Repère communiqué : direction Maman Colonel · adresse exacte à confirmer', 186::numeric, 3::smallint, 2::smallint, 240000::numeric, true
    ),
    (
      '00000000-0000-4000-8000-000000000102'::uuid, 'DAFS-LNG-001', 'Immeuble de 7 appartements à Lingwala', 'immeuble-7-appartements-lingwala', 'immeuble',
      'Immeuble annoncé avec 7 appartements, 2 boutiques, parking et terrasse.',
      'Immeuble annoncé avec 7 appartements neufs, un parking au rez-de-chaussée, 2 boutiques et une grande terrasse au dernier niveau. Le propriétaire indique une ligne électrique privée disponible 24 h/24 et 7 j/7 ainsi qu’un approvisionnement en eau. Année de construction annoncée : 2026 ; terrain acquis en 2024. Document mentionné : CE. Prix annoncé : 900 000 USD, offre directe. Adresse complète à renseigner.',
      'Lingwala', 'Mushi', '', null::numeric, null::smallint, null::smallint, 900000::numeric, false
    ),
    (
      '00000000-0000-4000-8000-000000000103'::uuid, 'DAFS-MNG-001', 'Parcelle avec maisons locatives à Mont-Ngafula', 'parcelle-maisons-locatives-mont-ngafula', 'parcelle',
      'Parcelle d’environ 360 m² avec maisons locatives au secteur CPA Mushi.',
      'Parcelle mise en vente dans la commune de Mont-Ngafula, secteur CPA Mushi, quartier CPA. Dimensions annoncées : 18 m × 20 m (environ 360 m²), avec des maisons destinées à la location. Revenu mensuel indiqué par le vendeur : 3 000 USD ; ce montant reste à vérifier avec le vendeur. Prix annoncé : 330 000 USD, à discuter. Adresse exacte à compléter.',
      'Mont-Ngafula', 'CPA', 'CPA Mushi · adresse exacte à confirmer', 360::numeric, null::smallint, null::smallint, 330000::numeric, true
    ),
    (
      '00000000-0000-4000-8000-000000000104'::uuid, 'DAFS-NGL-001', 'Villa et appartements à Ngaliema', 'villa-et-appartements-ngaliema', 'villa',
      'Ensemble immobilier annoncé sur environ 1 800 m² : villa et 6 appartements.',
      'Ensemble situé à Ngaliema, avec une villa annoncée de 5 chambres, 2 salons, cuisine équipée et 4 salles de bain, ainsi que 6 appartements de 2 chambres chacun. La description mentionne également terrasse, bar, piscine, jardin et 2 groupes électrogènes. Dimensions annoncées : 30 m × 60 m (environ 1 800 m²). Prix annoncé pour l’ensemble : 2 300 000 USD, à discuter. Une division en deux lots de 30 m × 30 m avec la villa principale est également évoquée, au prix indicatif de 1 500 000 USD. Repère communiqué : Météo, palais du marbre. Disponibilité et conditions à confirmer auprès de DAFS Sarlu.',
      'Ngaliema', '', 'Repère communiqué : Météo, palais du marbre · adresse exacte à confirmer', 1800::numeric, 5::smallint, 4::smallint, 2300000::numeric, true
    )
  ) as listings(id, reference, title, slug, category_slug, short_description, description, municipality, neighborhood, address, land_area_m2, bedrooms, bathrooms, price_amount, is_negotiable)
)
insert into public.properties (
  id, reference, category_id, title, slug, short_description, description,
  operation_type, property_status, publication_status, country, province, city,
  municipality, neighborhood, address, land_area_m2, bedrooms, bathrooms,
  price_amount, currency, pricing_period, is_negotiable, published_at
)
select
  l.id, l.reference, c.id, l.title, l.slug, l.short_description, l.description,
  'sale', 'available', 'published', 'République démocratique du Congo', 'Kinshasa', 'Kinshasa',
  l.municipality, nullif(l.neighborhood, ''), nullif(l.address, ''), l.land_area_m2,
  l.bedrooms, l.bathrooms, l.price_amount, 'USD', 'fixed', l.is_negotiable, now()
from source_listings l
join public.property_categories c on c.slug = l.category_slug
on conflict do nothing;

with media(property_slug, media_path, caption, sort_order, is_primary) as (
  values
    ('maison-basse-parcelle-bandalungwa', 'bandal/bandal-01.jpg', 'Vue 1', 0, true),
    ('maison-basse-parcelle-bandalungwa', 'bandal/bandal-02.jpg', 'Vue 2', 1, false),
    ('maison-basse-parcelle-bandalungwa', 'bandal/bandal-03.jpg', 'Vue 3', 2, false),
    ('maison-basse-parcelle-bandalungwa', 'bandal/bandal-04.jpg', 'Vue 4', 3, false),
    ('immeuble-7-appartements-lingwala', 'lingwala/lingwala-01.jpg', 'Vue de l’immeuble', 0, true),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-01.jpg', 'Vue 1', 0, true),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-02.jpg', 'Vue 2', 1, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-03.jpg', 'Vue 3', 2, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-04.jpg', 'Vue 4', 3, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-05.jpg', 'Vue 5', 4, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-06.jpg', 'Vue 6', 5, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-07.jpg', 'Vue 7', 6, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-08.jpg', 'Vue 8', 7, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-09.jpg', 'Vue 9', 8, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-10.jpg', 'Vue 10', 9, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-11.jpg', 'Vue 11', 10, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-12.jpg', 'Vue 12', 11, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-13.jpg', 'Vue 13', 12, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-14.jpg', 'Vue 14', 13, false),
    ('parcelle-maisons-locatives-mont-ngafula', 'mont-ngafula/mont-ngafula-15.jpg', 'Vue 15', 14, false),
    ('villa-et-appartements-ngaliema', 'ngaliema/ngaliema-tour-cover.jpg', 'Image de couverture extraite de la visite vidéo', 0, true),
    ('villa-et-appartements-ngaliema', 'ngaliema/ngaliema-tour.mp4', 'Visite vidéo', 1, false)
)
insert into public.property_images (property_id, storage_path, alt_text, caption, is_primary, sort_order)
select
  p.id,
  'local:/property-media/' || m.media_path,
  p.title,
  m.caption,
  m.is_primary and not exists (
    select 1 from public.property_images existing
    where existing.property_id = p.id and existing.is_primary
  ),
  m.sort_order
from media m
join public.properties p on p.slug = m.property_slug
on conflict (storage_path) do nothing;
