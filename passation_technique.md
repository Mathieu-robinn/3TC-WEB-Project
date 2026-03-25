# 24h-INSA : Documentation de Passation Technique (AI-Ready)

Ce document est conçu pour permettre à une autre IA de reprendre le développement du projet **24h-INSA** sans perte de contexte.

## 🏗 Architecture Globale

L'application est une plateforme de gestion de course full-stack :
- **Backend** : NestJS (TypeScript, Prisma ORM, PostgreSQL).
- **Frontend** : Nuxt 3 (Vue 3, Pinia for state management, Vuetify 3 for UI components).
- **Auth** : JWT (JSON Web Tokens) stockés dans des cookies sécurisés.

---

## 🚀 Démarrage Rapide

### Backend (`/backend`)
1. **Commandes** : `pnpm install` puis `pnpm start` (port 3000 par défaut).
2. **API Documentation** : [http://localhost:3000/api](http://localhost:3000/api) (Swagger UI).
3. **Admin Init** : `admin@24h-insa.fr / password123`.

### Frontend (`/frontend`)
1. **Commandes** : `pnpm install` puis `pnpm run dev --port 3001`.
2. **Configuration API** : Le proxy ou l'URL de base est gérée via le composable `useApi()`.
3. **URL locale** : [http://localhost:3001](http://localhost:3001).

---

## 🔑 Système d'Authentification

Le frontend gère l'auth via Pinia (`stores/auth.js`) et un composable centralisé `useApi()` :
- **useApi()** : `frontend/composables/useApi.js`.
  - Injecte automatiquement le header `Authorization: Bearer <token>` récupéré du cookie `auth_token`.
  - Gère les erreurs 401 en redirigeant vers `/login`.
- **Navigation Guard** : Les pages sensibles sont protégées par le middleware `auth.ts`.
- **Login Bug Fix** : Le bug du "double-clic" a été corrigé en utilisant `navigateTo()` directement après la réponse positive de l'API plutôt qu'en attendant le re-render du state.

---

## 🎨 Design System & UI/UX (2026 Premium)

Le projet utilise un sytème de thèmes moderne (Dark/Light) implémenté avec Vuetify 3.

### ⚠️ Règle d'OR pour les couleurs
**INTERDICTION** d'utiliser des couleurs CSS hardcodées (`background: white`, `color: #000`).
Utilisez **UNIQUEMENT** les variables de thème Vuetify :
- **Surfaces** : `rgb(var(--v-theme-surface))`
- **Bordures** : `rgba(var(--v-theme-on-surface), 0.12)`
- **Texte** : La couleur du texte s'adapte automatiquement si le composant est wrapé dans un `<v-app>` ou un `<v-card>`.

### Pages Clés
1. **Dashboard (`/index.vue`)** : KPIs en live, classement Top 5, graphes de progression.
2. **Équipes (`/equipes.vue`)** : 
   - 3 Vues : Grille (cards), Liste, et Classement (avec un podium animé).
   - CRUD complet (Créer/Modifier/Supprimer).
   - Intégration des participants : Les coureurs sont récupérés via l'objet `runners` lié à chaque équipe.
3. **Participants (`/participants.vue`)** : Gestion CRUD complète des coureurs et assignation aux équipes.

---

## 📦 Gestion des Données (Pinia Stores)

1. **`auth.js`** : État de connexion, stockage du token JWT.
2. **`equipes.js`** : Centralise `/teams` et `/teams/ranking`. Calcule dynamiquement le statut ("En piste", "En attente") basé sur l'état des transpondeurs.
3. **`participants.js`** : Centralise `/runners`. Gère l'historique de distribution des puces via `/transactions`.

---

## 🛠 Points Techniques & Bugs Corrigés

- **Dark Mode Typo** : Fixé en enveloppant les pages dans `<v-app>` (nécessaire pour que Vuetify applique correctement les contrastes).
- **API Unification** : Tous les `fetch` utilisaient des URL relatives floues. Ils utilisent maintenant tous le composable `useApi()`.
- **Join Local** : Certains endpoints API ne renvoient pas toutes les relations. Par exemple, pour les participants d'une équipe, il est préférable de faire un `fetchAll` des runners et de filtrer localement dans le store `equipes.js` pour une réactivité maximale.

---

## 🛤 Prochaines Étapes (Roadmap)

1. **Gestion des Puces (`/transpondeurs`)** :
   - Interface d'inventaire des 40 puces.
   - Intégration de la route `/transaction` (POST) pour assigner/rendre une puce proprement.
2. **Communication (WebSockets)** :
   - Mettre en place les WebSockets (Socket.io) pour les alertes de ravitaillement ou les changements de classement en temps réel.
3. **Logs & Audit** : Afficher l'historique complet des transactions de puces pour la traçabilité.

---

## 🧠 Note pour l'IA Reprenante
Le projet est en **Nuxt 3**. Ne pas utiliser `axios`, privilégier `$fetch` (via `useApi`). Le thème sombre est actif par défaut via le plugin Vuetify (`vuetify.ts`). Pour tout nouvel ajout de page, assurez-vous qu'elle utilise `v-container fluid class="pa-0"` pour respecter les marges "edge-to-edge" du design premium.
