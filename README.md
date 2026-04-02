# 24h INSA — Projet web

Application web d’organisation pour la course **24h INSA** : gestion des équipes, coureurs, transpondeurs, notifications, messagerie interne et logs d’audit.

## Architecture du dépôt

| Dossier | Rôle |
|----------|------|
| [`frontend/`](frontend/) | Interface Nuxt 3 (Vue 3, Vuetify, Pinia) |
| [`backend/`](backend/) | API REST NestJS, Prisma, PostgreSQL, WebSocket (Socket.IO) |

Chaque partie contient son propre `package.json` et sa documentation détaillée.

## Prérequis

- **Node.js** 20+ (recommandé)
- **pnpm** 9+
- **PostgreSQL** (pour le backend)

## Démarrage rapide

### 1. Backend

```bash
cd backend
pnpm install
```

Configurer un fichier `.env` (voir [`backend/README.md`](backend/README.md)) avec notamment `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` et `PORT`.

```bash
pnpm prisma migrate dev
pnpm run db:seed   # optionnel : données de démonstration
pnpm run start:dev
```

Par défaut l’API écoute sur le port **3000** si `PORT` n’est pas défini ; le projet peut utiliser **8000** en local (voir configuration frontend).

### 2. Frontend

```bash
cd frontend
pnpm install
```

Créer ou adapter `frontend/.env` :

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

(Aligner avec le port réel de l’API et le `CORS_ORIGIN` du backend.)

```bash
pnpm dev
```

L’interface de développement est généralement disponible sur **http://localhost:3000**.

### 3. Documentation API

Une fois le backend démarré, ouvrir la doc Swagger : `http://localhost:8000/docs` si l’API tourne sur le port 8000 (adapter selon `PORT` dans le backend).

## Documentation

- [Backend — installation, base de données, sécurité](backend/README.md)
- [Frontend — Nuxt, variables d’environnement, scripts](frontend/README.md)

## Dépôt

Hébergement GitLab INSA : `https://gitlab.insa-lyon.fr/rmathieu/24h-insa-projet-web`
