-- Replace only the original starter copy from the first services migration.
-- Any administrator-edited body or feature list is preserved.
update public.service_pages
set
  body = case
    when slug = 'demenagement-amenagement'
      and body = 'DAFS Sarlu vous accompagne dans la préparation d’un déménagement et la réflexion autour de l’aménagement de vos espaces. Décrivez les lieux concernés, votre besoin et le résultat recherché afin que l’équipe puisse préciser avec vous le périmètre et les modalités de la demande.'
    then 'DAFS Sarlu propose un accompagnement pour organiser un déménagement et préparer l’installation dans un nouvel espace. Chaque demande commence par la compréhension des lieux concernés, du volume à déplacer, des dates souhaitées et du résultat attendu.' || chr(10) || chr(10) || 'Selon le périmètre retenu avec l’entreprise, le projet peut inclure la préparation logistique, le déplacement des biens, leur installation ou une réflexion sur l’agencement. Les tâches exactes, les moyens de transport et de manutention, les fournitures, les accès et les éventuelles exclusions doivent être confirmés avant toute intervention.' || chr(10) || chr(10) || 'Pour l’aménagement, décrivez l’usage de la pièce, les meubles ou équipements concernés, les contraintes du lieu et vos priorités. DAFS Sarlu pourra préciser les options qu’elle est en mesure de prendre en charge, les délais possibles et les modalités de la prestation.'
    when slug = 'cleaner'
      and body = 'Le service Cleaner concerne le nettoyage de logements et d’espaces professionnels. Indiquez le type d’espace, les surfaces concernées et votre besoin dans votre demande ; le périmètre et les modalités pourront ensuite être précisés avec DAFS Sarlu.'
    then 'Le service Cleaner concerne le nettoyage de logements et d’espaces professionnels. Pour comprendre le besoin, indiquez le type de local, sa commune et son quartier, sa superficie approximative, son état actuel et les pièces ou zones à traiter.' || chr(10) || chr(10) || 'La demande peut préciser les tâches recherchées — par exemple l’entretien courant ou un nettoyage plus approfondi — sans présumer que chaque option est disponible. DAFS Sarlu confirmera les tâches prises en charge, la fréquence possible, la durée estimée, les produits et équipements fournis ou à prévoir, ainsi que les conditions d’accès.' || chr(10) || chr(10) || 'Avant de convenir d’une intervention, faites préciser le périmètre, le calendrier, le prix et la personne responsable de l’ouverture ou de la remise des clés. Ces éléments permettent d’éviter les malentendus et d’établir une proposition adaptée au lieu.'
    else body
  end,
  features = case
    when slug = 'demenagement-amenagement' and features = '["Préparer l’organisation du déménagement selon le besoin communiqué.", "Réfléchir à l’agencement du nouvel espace.", "Préciser le périmètre et les modalités avec DAFS Sarlu."]'::jsonb
      then '["Préparer l’organisation du déménagement selon le besoin communiqué.", "Étudier l’installation et l’agencement de l’espace selon le périmètre convenu.", "Confirmer les moyens, les dates, les tâches et le prix avant l’intervention."]'::jsonb
    when slug = 'cleaner' and features = '["Nettoyage de logements.", "Nettoyage d’espaces professionnels.", "Périmètre et modalités définis avec l’équipe selon la demande."]'::jsonb
      then '["Nettoyage de logements et d’espaces professionnels.", "Périmètre, tâches et fréquence précisés selon chaque lieu.", "Produits, équipements, calendrier et prix confirmés avec DAFS Sarlu."]'::jsonb
    else features
  end,
  updated_at = now()
where slug in ('demenagement-amenagement', 'cleaner');
