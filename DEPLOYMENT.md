# Mise en production DAFS Sarlu

Le dépôt contient deux applications Next.js indépendantes, prévues pour deux projets Vercel : le site à la racine et l’admin dans admin/.

## 1. Activer Supabase

Dans le SQL Editor du projet Supabase, exécuter dans l’ordre les quatre fichiers sous `supabase/migrations/`. Le mot de passe PostgreSQL n’est pas nécessaire pour cette méthode.

Ensuite, suivre la section « Créer le premier compte administrateur » de `supabase/SETUP.md`.

Les tables doivent répondre avant le déploiement : le site utilise les annonces, les plans et les paramètres du site ; le formulaire public enregistre dans `inquiries`.

## 2. Configurer Turnstile

Créer un widget Cloudflare Turnstile et autoriser les domaines de production du site public. Dans les variables du déploiement public, définir :

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` avec la clé publique du widget ;
- `TURNSTILE_SECRET_KEY` avec sa clé secrète.

Les demandes publiques sont refusées en production si le secret n’est pas présent. La clé secrète reste côté serveur.

## 3. Créer les déploiements Vercel

Importer le dépôt GitHub Jan1791/dafs-sarlu deux fois dans Vercel. Pour un dépôt public contenant du code source, vérifier qu’aucun secret ou contenu privé n’est versionné. Dans les réglages de chaque projet, choisir le **Root Directory** correspondant.

Déploiement public — Root Directory `.` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (domaine public définitif)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Déploiement admin — Root Directory `admin` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PUBLIC_SITE_URL` (URL du site public)

Vercel détecte les applications Next.js et utilise les scripts `build` présents dans chaque `package.json`.

## 4. Finaliser les domaines et l’authentification

- Ajouter les domaines définitifs au widget Turnstile.
- Dans Supabase **Authentication → URL Configuration**, définir l’URL du projet admin et ses URL de redirection de production.
- Vérifier l’envoi des e-mails de connexion/récupération et configurer un SMTP dédié avant d’ouvrir l’accès aux administrateurs.
- Vérifier que le site répond en HTTPS et que la politique RLS est active sur chaque table.

## Périmètre actuellement opérationnel

L’admin gère les annonces (édition, photo principale et suppression complète), les plans, les demandes entrantes, les pages de services et la bibliothèque d’images/vidéos. Les informations éditoriales de base (accueil, présentation, FAQ, mentions légales, coordonnées) se règlent dans Paramètres. Les barèmes/simulateur, gestion des comptes depuis l’interface, rapports et réservations détaillées restent à construire à partir des règles métier validées par DAFS Sarlu.

Les aperçus publics de plans sont pris dans le bucket public ; les fichiers originaux restent privés.
