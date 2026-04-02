# Frontend — Application 24h INSA

Interface d’administration et de suivi pour la course 24h INSA, construite avec **Nuxt 3** et **Vue 3**.

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement](#lancement)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Lien avec l’API](#lien-avec-lapi)
- [Build et déploiement](#build-et-déploiement)

## Stack technique

- **Nuxt 3** — framework Vue, routing, SSR/ISR selon usage
- **Vue 3** — Composition API
- **Vuetify 4** — UI (Material Design), module `vuetify-nuxt-module`
- **Pinia** — état global (stores par domaine métier)
- **Socket.IO client** — temps réel (messagerie, notifications)
- **Chart.js** + **vue-chartjs** — graphiques
- **Quill** — éditeur de texte riche
- **Sass** — styles
- **Lightning CSS** — minification CSS (compatibilité Vuetify 4)

## Prérequis

- Node.js 20+
- pnpm 9+

## Installation

Depuis le dossier `frontend` :

```bash
pnpm install
```

(`postinstall` exécute `nuxt prepare` pour générer les types et la config Nuxt.)

## Configuration

Les variables publiques exposées au navigateur passent par `runtimeConfig.public` dans `nuxt.config.ts`.

| Variable | Description |
|----------|-------------|
| `NUXT_PUBLIC_API_BASE` | URL de base de l’API REST (sans slash final). Si absente, défaut : `http://localhost:8000` |

Exemple de fichier `.env` à la racine du frontend :

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

Adapter le port à celui du backend (`PORT` dans `backend/.env`). Pour le développement, le backend doit autoriser l’origine du frontend dans `CORS_ORIGIN` (ex. `http://localhost:3000`).

## Lancement

```bash
pnpm dev
```

Serveur de développement Nuxt : en général **http://localhost:3000** (port affiché dans le terminal).

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement avec rechargement à chaud |
| `pnpm build` | Build de production (`nuxt build`) |
| `pnpm preview` | Prévisualisation locale du build |
| `pnpm generate` | Génération statique (`nuxt generate`), si applicable au déploiement |

## Structure du projet

- `pages/` — routes (login, dashboard, équipes, transpondeurs, communication, etc.)
- `features/` — logique et UI par domaine (`auth`, `equipes`, `dashboard`, `communication`, …) avec composants, stores Pinia, utilitaires
- `components/` — composants partagés
- `assets/` — CSS (`admin-pages.css`), ressources statiques
- `nuxt.config.ts` — modules, Vuetify, Pinia, `runtimeConfig`, Vite

Les composants métier sont enregistrés automatiquement depuis les dossiers listés dans `nuxt.config.ts` (`components`).

## Lien avec l’API

- **REST** : `NUXT_PUBLIC_API_BASE` doit pointer vers la même instance que le backend NestJS.
- **Swagger** : documentation interactive sur `http://<api-host>:<port>/docs`.
- **WebSocket** : Socket.IO côté client ; l’URL doit correspondre au serveur backend (même origine ou configuration CORS / proxy selon l’environnement).

Pour plus de détails (JWT, migrations, seed, sécurité) : [`../backend/README.md`](../backend/README.md).

## Build et déploiement

```bash
pnpm build
pnpm preview
```

Consultez la [documentation officielle Nuxt — déploiement](https://nuxt.com/docs/getting-started/deployment) pour l’hébergement (Node, statique, edge, etc.).
