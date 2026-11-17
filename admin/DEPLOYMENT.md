# Déploiement de l’espace admin

L’application est préparée pour Vercel avec Next.js. Configurer ces variables dans le projet d’hébergement :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PUBLIC_SITE_URL`

Le schéma Supabase doit être appliqué avant la première connexion. Créer ensuite le premier compte Auth et lui attribuer le rôle administrateur selon `DAFS-Services/supabase/SETUP.md`.

Dans Supabase **Authentication → URL Configuration**, ajouter l’URL HTTPS de l’admin aux URL du site et de redirection. Configurer un SMTP dédié pour les courriels d’authentification avant d’ouvrir l’accès.

Le dépôt GitHub contient les deux applications. Dans Vercel, importer ce dépôt et définir **Root Directory** sur admin. Le guide commun se trouve dans ../DEPLOYMENT.md.

L’admin gère les annonces (dont leur suppression et le remplacement de la photo principale), les plans, les demandes, les pages « Déménagement & aménagement » et « Cleaner », et une bibliothèque de médias avec import par dossier, classement, association à un service et publication contrôlée. Après la migration 202611170001, les textes d’accueil, À propos, FAQ, informations légales et coordonnées se modifient aussi dans Paramètres. Les barèmes/simulateur, gestion des utilisateurs, rapports et réservations détaillées nécessitent encore leurs règles métier.
