# DAFS Sarlu

Plateforme web DAFS Sarlu réalisée avec Next.js, React, TypeScript, Tailwind CSS v4 et Supabase.

## Applications

- Site public : application à la racine du dépôt.
- Administration : application indépendante dans admin/.

Les deux applications sont conçues pour des projets Vercel distincts et utilisent le même projet Supabase.

## Développement local

Site public :

    npm install
    npm run dev

Dans un second terminal, lancer l’admin :

    cd admin
    npm install
    npm run dev -- --port 3001

Créer .env.local depuis .env.example pour le site public et admin/.env.local depuis admin/.env.example pour le tableau d’administration. Ne jamais versionner les fichiers .env.local, une clé Supabase secrète/service_role, le mot de passe PostgreSQL ou une clé Resend.

## Base de données et e-mails

Exécuter les migrations dans supabase/migrations/ dans l’ordre, puis suivre supabase/SETUP.md pour créer le premier administrateur et configurer l’envoi SMTP Resend dans Supabase Auth.

## Déploiement

Voir DEPLOYMENT.md. Importer le dépôt deux fois dans Vercel : Root Directory . pour le site public et admin pour l’espace d’administration.
