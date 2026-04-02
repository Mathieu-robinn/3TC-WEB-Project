# Backend - API 24h INSA

API REST et WebSocket du projet 24h INSA, construite avec NestJS, Prisma et PostgreSQL.

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prerequis)
- [Installation rapide](#installation-rapide)
- [Configuration](#configuration)
- [Base de donnees](#base-de-donnees)
- [Lancement](#lancement)
- [Documentation API](#documentation-api)
- [WebSocket temps reel](#websocket-temps-reel)
- [Scripts disponibles](#scripts-disponibles)
- [Structure fonctionnelle](#structure-fonctionnelle)
- [Securite](#securite)
- [Depannage](#depannage)

## Stack technique

- `NestJS` 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`)
- `Prisma` 7 (`@prisma/client`, migrations SQL, seed TypeScript)
- `PostgreSQL` (via `pg` et `@prisma/adapter-pg`)
- `JWT` + `Passport` pour l'authentification
- `Socket.IO` pour la messagerie et les notifications en temps reel
- Validation et hardening: `class-validator`, `class-transformer`, `helmet`

## Prerequis

- `Node.js` 20+ (recommande)
- `pnpm` 9+
- Une base PostgreSQL accessible

## Installation rapide

Depuis le dossier `backend`:

```bash
pnpm install
```

## Configuration

L'application charge les variables via `ConfigModule.forRoot()` et `dotenv`.

Variables attendues:

- `DATABASE_URL`: URL PostgreSQL principale
- `SHADOW_DATABASE_URL`: URL PostgreSQL shadow pour les migrations Prisma
- `JWT_SECRET`: secret de signature des tokens
- `JWT_EXPIRES_IN`: duree de validite des tokens (ex: `24h`)
- `PORT`: port HTTP de l'API (defaut `3000`)
- `CORS_ORIGIN`: origines autorisees (liste separee par des virgules)

Exemple:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/insa?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/insa_shadow?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="24h"
PORT=8000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Base de donnees

Schema Prisma: `prisma/schema.prisma`.

Commandes usuelles:

```bash
# appliquer les migrations en local
pnpm prisma migrate dev

# regenerer le client prisma
pnpm prisma generate

# seed de donnees de demo
pnpm run db:seed

# reset complet (sans seed)
pnpm run db:reset

# reset complet + seed
pnpm run db:reset:seed
```

Le seed cree un jeu de donnees realiste (utilisateurs, editions, courses, equipes, puces, transactions, logs, notifications et messagerie).

## Lancement

```bash
# mode developpement (watch)
pnpm run start:dev

# mode standard
pnpm run start

# build + execution production
pnpm run build
pnpm run start:prod
```

Une fois demarree:

- API: `http://localhost:<PORT>`
- Swagger: `http://localhost:<PORT>/docs`

## Documentation API

La documentation OpenAPI est exposee via Swagger sur `/docs`.

Authentification:

1. Appeler `POST /auth/login` pour obtenir un JWT.
2. Dans Swagger, cliquer sur **Authorize**.
3. Renseigner `Bearer <token>`.

La route `POST /auth/register` est reservee aux utilisateurs `ADMIN` authentifies.

## WebSocket temps reel

Gateway Socket.IO active via `EventsGateway`.

- Auth a la connexion via JWT (`handshake.auth.token` ou header `Authorization`)
- Emission de messages de conversation sur `conversation:<id>:newMessage`
- Emission de notifications ciblees sur `newNotification`

## Scripts disponibles

| Script | Description |
| --- | --- |
| `pnpm run start` | Demarrage NestJS |
| `pnpm run start:dev` | Demarrage avec watch |
| `pnpm run start:debug` | Demarrage avec debug + watch |
| `pnpm run start:prod` | Execution du build `dist/main` |
| `pnpm run build` | Build TypeScript |
| `pnpm run lint` | Lint ESLint (`--fix`) |
| `pnpm run format` | Format Prettier |
| `pnpm run test` | Tests unitaires |
| `pnpm run test:e2e` | Tests end-to-end |
| `pnpm run test:cov` | Couverture de tests |
| `pnpm run db:seed` | Seed Prisma |
| `pnpm run db:reset` | Reset Prisma sans seed |
| `pnpm run db:reset:seed` | Reset Prisma avec seed |

## Structure fonctionnelle

Domaines principaux exposes par l'API:

- Authentification (`/auth`)
- Utilisateurs (`/users`, `/user/:id`, `/me`)
- Editions et courses (`/editions`, `/edition/:id/*`, `/courses`, `/course/:id`)
- Equipes et coureurs (`/teams`, `/team/:id`, `/runners`, `/runner/:id`)
- Transpondeurs et transactions (`/transponders`, `/transponder/:id/*`, `/transactions`)
- Notifications (`/notifications`)
- Messagerie interne (`/messaging/*`)
- Logs d'audit (`/logs`)

La reference contractuelle des routes et schemas reste Swagger (`/docs`).

## Securite

- `helmet` active des headers de securite HTTP.
- Validation globale activee avec `ValidationPipe`:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- En production, `CORS_ORIGIN` est obligatoire au demarrage.

Bonnes pratiques:

- ne jamais versionner des secrets reels (`.env`)
- utiliser un `JWT_SECRET` long, aleatoire et unique par environnement
- restreindre strictement `CORS_ORIGIN` en production

## Depannage

- **Erreur CORS en prod**: verifier que `CORS_ORIGIN` est defini et correct.
- **Connexion BDD impossible**: verifier `DATABASE_URL` et l'accessibilite PostgreSQL.
- **JWT invalide**: verifier `JWT_SECRET` et le format `Authorization: Bearer <token>`.
- **Migrations Prisma en echec**: verifier `SHADOW_DATABASE_URL` et les droits SQL.

## Ressources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4)
