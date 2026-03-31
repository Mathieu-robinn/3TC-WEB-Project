<template>
  <div class="ranking-page">
    <!-- ─── Hero ─── -->
    <section class="ranking-hero">
      <div class="ranking-hero__bg" aria-hidden="true" />
      <div class="ranking-hero__content">
        <div class="ranking-hero__eyebrow">
          <v-icon size="16" color="#f59e0b">mdi-flag-checkered</v-icon>
          <span>Classement en direct</span>
        </div>
        <h1 class="ranking-hero__heading">
          24h INSA
          <span v-if="activeCourse" class="ranking-hero__course">— {{ activeCourse.name }}</span>
        </h1>
        <div class="ranking-hero__meta">
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ ranking.length }}</span>
            <span class="ranking-hero__stat-label">équipes</span>
          </div>
          <div class="ranking-hero__stat-sep" />
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ totalLaps }}</span>
            <span class="ranking-hero__stat-label">tours cumulés</span>
          </div>
          <div class="ranking-hero__stat-sep" />
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ totalDistance }} km</span>
            <span class="ranking-hero__stat-label">distance totale</span>
          </div>
        </div>

        <div class="ranking-hero__refresh">
          <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-refresh</v-icon>
          <span>Mise à jour automatique toutes les 30 s</span>
          <span v-if="lastRefreshed" class="ranking-hero__refresh-time">
            · Dernière : {{ lastRefreshed }}
          </span>
        </div>
      </div>
    </section>

    <!-- ─── Loading ─── -->
    <div v-if="loading && ranking.length === 0" class="ranking-loading">
      <v-progress-circular indeterminate color="#f59e0b" size="48" width="4" />
      <p class="ranking-loading__label">Chargement du classement…</p>
    </div>

    <!-- ─── Erreur ─── -->
    <div v-else-if="error && ranking.length === 0" class="ranking-error">
      <v-icon size="40" color="rgba(255,255,255,0.4)">mdi-wifi-off</v-icon>
      <p>Impossible de charger le classement.</p>
      <v-btn variant="outlined" color="white" size="small" @click="fetchData">Réessayer</v-btn>
    </div>

    <!-- ─── Aucun résultat de recherche ─── -->
    <div v-else-if="!loading && filteredRanking.length === 0 && ranking.length > 0" class="ranking-empty">
      <v-icon size="40" color="rgba(255,255,255,0.25)">mdi-magnify-remove-outline</v-icon>
      <p>Aucune équipe ne correspond à « {{ search }} »</p>
      <button class="clear-search-btn" @click="search = ''">Effacer la recherche</button>
    </div>

    <!-- ─── Vide (pas de données) ─── -->
    <div v-else-if="!loading && ranking.length === 0" class="ranking-empty">
      <v-icon size="48" color="rgba(255,255,255,0.25)">mdi-trophy-outline</v-icon>
      <p>Aucune équipe enregistrée pour le moment.</p>
    </div>

    <!-- ─── Contenu principal ─── -->
    <section v-else class="ranking-table-section">

      <!-- Leader banner — masqué si recherche active -->
      <div v-if="!search && filteredRanking[0]" class="ranking-leader-banner">
        <div class="ranking-leader-banner__inner">
          <div class="ranking-leader-trophy">
            <v-icon size="28" color="#f59e0b">mdi-trophy</v-icon>
          </div>
          <div class="ranking-leader-info">
            <span class="ranking-leader-label">Leader actuel</span>
            <span class="ranking-leader-name">{{ filteredRanking[0].name }}</span>
            <div class="ranking-leader-runners">
              <span
                v-for="r in (filteredRanking[0].runners || []).slice(0, 5)"
                :key="r.id"
                class="runner-avatar runner-avatar--sm"
                :title="`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()"
              >
                {{ initials(r) }}
              </span>
              <span
                v-if="(filteredRanking[0].runners || []).length > 5"
                class="runner-avatar runner-avatar--sm runner-avatar--more"
              >
                +{{ (filteredRanking[0].runners || []).length - 5 }}
              </span>
            </div>
          </div>
          <div class="ranking-leader-score">
            <span class="ranking-leader-tours">{{ filteredRanking[0].nbTour || 0 }}</span>
            <span class="ranking-leader-unit">tours · {{ leaderDistance }}</span>
          </div>
        </div>
      </div>

      <!-- Podium (top 3 — masqué si recherche active) -->
      <div v-if="!search && filteredRanking.length >= 3" class="ranking-podium">
        <div class="podium-slot podium-slot--2">
          <div class="podium-medal podium-medal--silver">2</div>
          <div class="podium-name">{{ filteredRanking[1]?.name }}</div>
          <div class="podium-runners">
            <span v-for="r in (filteredRanking[1]?.runners || []).slice(0,3)" :key="r.id" class="runner-avatar runner-avatar--xs" :title="`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()">{{ initials(r) }}</span>
            <span v-if="(filteredRanking[1]?.runners || []).length > 3" class="runner-avatar runner-avatar--xs runner-avatar--more">+{{ (filteredRanking[1]?.runners || []).length - 3 }}</span>
          </div>
          <div class="podium-tours">{{ filteredRanking[1]?.nbTour || 0 }} tours</div>
          <div class="podium-dist">{{ formatDist(filteredRanking[1]?.nbTour) }}</div>
          <div class="podium-bar podium-bar--silver" />
        </div>
        <div class="podium-slot podium-slot--1">
          <div class="podium-star"><v-icon size="20" color="#f59e0b">mdi-star</v-icon></div>
          <div class="podium-medal podium-medal--gold">1</div>
          <div class="podium-name">{{ filteredRanking[0]?.name }}</div>
          <div class="podium-runners">
            <span v-for="r in (filteredRanking[0]?.runners || []).slice(0,3)" :key="r.id" class="runner-avatar runner-avatar--xs" :title="`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()">{{ initials(r) }}</span>
            <span v-if="(filteredRanking[0]?.runners || []).length > 3" class="runner-avatar runner-avatar--xs runner-avatar--more">+{{ (filteredRanking[0]?.runners || []).length - 3 }}</span>
          </div>
          <div class="podium-tours">{{ filteredRanking[0]?.nbTour || 0 }} tours</div>
          <div class="podium-dist">{{ formatDist(filteredRanking[0]?.nbTour) }}</div>
          <div class="podium-bar podium-bar--gold" />
        </div>
        <div class="podium-slot podium-slot--3">
          <div class="podium-medal podium-medal--bronze">3</div>
          <div class="podium-name">{{ filteredRanking[2]?.name }}</div>
          <div class="podium-runners">
            <span v-for="r in (filteredRanking[2]?.runners || []).slice(0,3)" :key="r.id" class="runner-avatar runner-avatar--xs" :title="`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()">{{ initials(r) }}</span>
            <span v-if="(filteredRanking[2]?.runners || []).length > 3" class="runner-avatar runner-avatar--xs runner-avatar--more">+{{ (filteredRanking[2]?.runners || []).length - 3 }}</span>
          </div>
          <div class="podium-tours">{{ filteredRanking[2]?.nbTour || 0 }} tours</div>
          <div class="podium-dist">{{ formatDist(filteredRanking[2]?.nbTour) }}</div>
          <div class="podium-bar podium-bar--bronze" />
        </div>
      </div>

      <!-- ─── Recherche + filtres course ─── -->
      <div class="ranking-controls">
        <div class="search-wrap">
          <v-icon class="search-icon" size="18" color="rgba(255,255,255,0.4)">mdi-magnify</v-icon>
          <input
            v-model="search"
            class="search-input"
            type="search"
            placeholder="Rechercher une équipe ou un participant…"
            aria-label="Rechercher une équipe"
          />
          <button v-if="search" class="search-clear" aria-label="Effacer" @click="search = ''">
            <v-icon size="16" color="rgba(255,255,255,0.4)">mdi-close</v-icon>
          </button>
        </div>
        <div v-if="courses.length > 1" class="filter-pills">
          <button
            v-for="c in courseFilterOptions"
            :key="c.id ?? 'all'"
            class="filter-btn"
            :class="{ 'filter-btn--active': selectedCourseId === c.id }"
            @click="selectedCourseId = c.id"
          >
            {{ c.name }}
          </button>
        </div>
      </div>

      <!-- Compteur résultats si recherche -->
      <div v-if="search" class="search-results-label">
        {{ filteredRanking.length }} équipe{{ filteredRanking.length > 1 ? 's' : '' }} trouvée{{ filteredRanking.length > 1 ? 's' : '' }}
      </div>

      <!-- Liste complète -->
      <div class="ranking-list">
        <div
          v-for="(team, idx) in filteredRanking"
          :key="team.id"
          class="ranking-row"
          :class="{
            'ranking-row--gold': !search && idx === 0,
            'ranking-row--silver': !search && idx === 1,
            'ranking-row--bronze': !search && idx === 2,
          }"
        >
          <!-- Rang -->
          <div class="ranking-row__rank">
            <span v-if="!search && idx === 0" class="rank-medal rank-medal--gold">1</span>
            <span v-else-if="!search && idx === 1" class="rank-medal rank-medal--silver">2</span>
            <span v-else-if="!search && idx === 2" class="rank-medal rank-medal--bronze">3</span>
            <span v-else class="rank-number">{{ globalRank(team) }}</span>
          </div>

          <!-- Nom + participants -->
          <div class="ranking-row__info">
            <div class="ranking-row__name-line">
              <span class="ranking-row__name">{{ team.name }}</span>
              <span v-if="courses.length > 1 && displayedCourse(team)" class="ranking-row__course-tag">
                {{ displayedCourse(team) }}
              </span>
            </div>
            <!-- Participants -->
            <div v-if="(team.runners || []).length > 0" class="ranking-row__runners">
              <span
                v-for="r in (team.runners || []).slice(0, 8)"
                :key="r.id"
                class="runner-avatar runner-avatar--sm"
                :title="`${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()"
              >
                {{ initials(r) }}
              </span>
              <span
                v-if="(team.runners || []).length > 8"
                class="runner-avatar runner-avatar--sm runner-avatar--more"
                :title="(team.runners || []).slice(8).map(r => `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim()).join(', ')"
              >
                +{{ (team.runners || []).length - 8 }}
              </span>
            </div>
            <div v-else class="ranking-row__no-runners">
              <v-icon size="12" color="rgba(255,255,255,0.2)">mdi-account-off-outline</v-icon>
              <span>Aucun participant</span>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="ranking-row__progress-wrap">
            <div class="ranking-row__progress-bar">
              <div
                class="ranking-row__progress-fill"
                :style="{ width: progressWidth(team.nbTour) }"
                :class="{
                  'progress-fill--gold': !search && idx === 0,
                  'progress-fill--gradient': search || idx > 0,
                }"
              />
            </div>
          </div>

          <!-- Score -->
          <div class="ranking-row__score">
            <span class="ranking-row__tours">{{ team.nbTour || 0 }}</span>
            <span class="ranking-row__tours-label">tours</span>
          </div>

          <div class="ranking-row__distance">
            {{ formatDist(team.nbTour) }}
          </div>
        </div>
      </div>

      <!-- Refresh manuel -->
      <div class="ranking-footer">
        <v-btn
          variant="text"
          color="rgba(255,255,255,0.5)"
          size="small"
          :loading="loading"
          prepend-icon="mdi-refresh"
          @click="fetchData"
        >
          Actualiser maintenant
        </v-btn>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ApiTeam, ApiCourse, ApiRunner } from '~/types/api'

/** 1 tour = 1.6 km */
const DIST_PER_LAP_KM = 1.6

// eslint-disable-next-line @typescript-eslint/no-explicit-any
definePageMeta({ layout: 'public' as any })

useHead({
  title: 'Classement en direct — 24h INSA',
  meta: [{ name: 'description', content: 'Suivez le classement en temps réel des équipes du 24h INSA : nombre de tours, distance parcourue et participants.' }],
})

// ─── State ───────────────────────────────────────────────────────────────────
const ranking = ref<ApiTeam[]>([])
const courses = ref<ApiCourse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const lastRefreshed = ref<string | null>(null)
const selectedCourseId = ref<number | null>(null)
const search = ref('')

let timer: ReturnType<typeof setInterval> | null = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const activeCourse = computed(() =>
  courses.value.length === 1 ? courses.value[0] : null,
)

const courseFilterOptions = computed(() => [
  { id: null as number | null, name: 'Toutes' },
  ...courses.value.map((c) => ({ id: c.id as number | null, name: c.name })),
])

/** Classement filtré par course (sans recherche) — sert de base pour le rang global */
const courseFiltered = computed(() => {
  if (selectedCourseId.value == null) return ranking.value
  return ranking.value.filter((t) => t.courseId === selectedCourseId.value)
})

/** Classement filtré par course ET recherche texte */
const filteredRanking = computed(() => {
  const q = normalize(search.value)
  if (!q) return courseFiltered.value
  return courseFiltered.value.filter((t) => {
    if (normalize(t.name ?? '').includes(q)) return true
    return (t.runners ?? []).some((r) =>
      normalize(`${r.firstName ?? ''} ${r.lastName ?? ''}`).includes(q),
    )
  })
})

const maxLaps = computed(() =>
  Math.max(1, ...courseFiltered.value.map((t) => t.nbTour || 0)),
)

const totalLaps = computed(() =>
  courseFiltered.value.reduce((s, t) => s + (t.nbTour || 0), 0),
)

const totalDistance = computed(() =>
  (totalLaps.value * DIST_PER_LAP_KM).toFixed(1),
)

const leaderDistance = computed(() => {
  const top = filteredRanking.value[0]
  return top ? formatDist(top.nbTour) : '0 km'
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatDist(nbTour?: number | null): string {
  return `${((nbTour || 0) * DIST_PER_LAP_KM).toFixed(1)} km`
}

function progressWidth(nbTour?: number | null): string {
  const pct = ((nbTour || 0) / maxLaps.value) * 100
  return `${Math.max(pct, 2)}%`
}

function displayedCourse(team: ApiTeam): string | null {
  return courses.value.find((c) => c.id === team.courseId)?.name ?? null
}

function stampNow(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function initials(r: ApiRunner): string {
  const f = (r.firstName?.[0] ?? '').toUpperCase()
  const l = (r.lastName?.[0] ?? '').toUpperCase()
  return f + l || '?'
}

/** Retourne le rang réel de l'équipe dans le classement filtré par course (sans recherche). */
function globalRank(team: ApiTeam): number {
  return courseFiltered.value.findIndex((t) => t.id === team.id) + 1
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  error.value = null
  const config = useRuntimeConfig()
  const apiBase = (config.public?.apiBase as string | undefined) || 'http://localhost:8000'

  try {
    const [rankingData, coursesData] = await Promise.all([
      $fetch<ApiTeam[]>(`${apiBase}/teams/ranking`),
      $fetch<ApiCourse[]>(`${apiBase}/courses`),
    ])
    ranking.value = Array.isArray(rankingData) ? rankingData : []
    courses.value = Array.isArray(coursesData) ? coursesData : []
    lastRefreshed.value = stampNow()
    if (selectedCourseId.value != null && !courses.value.find((c) => c.id === selectedCourseId.value)) {
      selectedCourseId.value = null
    }
  } catch {
    error.value = 'API non disponible'
    // Données de démo avec participants
    ranking.value = [
      { id: 1, name: 'Les Flèches', nbTour: 48, courseId: 1, runners: [
        { id: 1, firstName: 'Thomas', lastName: 'Martin', teamId: 1 },
        { id: 2, firstName: 'Marie', lastName: 'Dupont', teamId: 1 },
        { id: 3, firstName: 'Julien', lastName: 'Petit', teamId: 1 },
      ]},
      { id: 2, name: 'Team INSA', nbTour: 43, courseId: 1, runners: [
        { id: 4, firstName: 'Sophie', lastName: 'Bernard', teamId: 2 },
        { id: 5, firstName: 'Lucas', lastName: 'Moreau', teamId: 2 },
      ]},
      { id: 3, name: 'Les Rapides', nbTour: 39, courseId: 1, runners: [
        { id: 6, firstName: 'Emma', lastName: 'Rousseau', teamId: 3 },
        { id: 7, firstName: 'Hugo', lastName: 'Dubois', teamId: 3 },
        { id: 8, firstName: 'Léa', lastName: 'Simon', teamId: 3 },
        { id: 9, firstName: 'Romain', lastName: 'Laurent', teamId: 3 },
      ]},
      { id: 4, name: 'Sprint Masters', nbTour: 35, courseId: 1, runners: [
        { id: 10, firstName: 'Clara', lastName: 'Michel', teamId: 4 },
      ]},
      { id: 5, name: 'Les Coureurs', nbTour: 31, courseId: 1, runners: [
        { id: 11, firstName: 'Antoine', lastName: 'Garcia', teamId: 5 },
        { id: 12, firstName: 'Camille', lastName: 'Lefebvre', teamId: 5 },
      ]},
      { id: 6, name: 'Team Endurance', nbTour: 28, courseId: 2, runners: [
        { id: 13, firstName: 'Nathan', lastName: 'Fontaine', teamId: 6 },
      ]},
      { id: 7, name: 'Les Marathoniens', nbTour: 22, courseId: 2, runners: [] },
      { id: 8, name: 'Vitesse+', nbTour: 18, courseId: 1, runners: [
        { id: 14, firstName: 'Inès', lastName: 'Mercier', teamId: 8 },
        { id: 15, firstName: 'Paul', lastName: 'Chevalier', teamId: 8 },
        { id: 16, firstName: 'Anaïs', lastName: 'Robin', teamId: 8 },
      ]},
    ]
    courses.value = [
      { id: 1, name: '24 Heures', distanceTour: 1.6 },
      { id: 2, name: '12 Heures', distanceTour: 1.6 },
    ]
    lastRefreshed.value = stampNow()
  } finally {
    loading.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchData()
  timer = setInterval(fetchData, 30_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  background: #0d1117;
  color: #f1f5f9;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── hero ── */
.ranking-hero {
  position: relative;
  overflow: hidden;
  padding: 56px 24px 48px;
  text-align: center;
}

.ranking-hero__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 70%),
              linear-gradient(180deg, #1a1f36 0%, #0d1117 100%);
  z-index: 0;
}

.ranking-hero__content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}

.ranking-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f59e0b;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 16px;
}

.ranking-hero__heading {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.ranking-hero__course {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.ranking-hero__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin: 24px 0 16px;
}

.ranking-hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ranking-hero__stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.ranking-hero__stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ranking-hero__stat-sep {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.12);
}

.ranking-hero__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
}

.ranking-hero__refresh-time { color: rgba(255, 255, 255, 0.22); }

/* ── controls ── */
.ranking-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

/* search */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 10px 40px 10px 42px;
  font-size: 0.9rem;
  color: #f1f5f9;
  font-family: inherit;
  outline: none;
  transition: border-color 0.18s ease, background 0.18s ease;
}

.search-input::placeholder { color: rgba(255, 255, 255, 0.3); }

.search-input:focus {
  border-color: rgba(245, 158, 11, 0.45);
  background: rgba(255, 255, 255, 0.08);
}

/* clear button */
.search-clear {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* filter pills */
.filter-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.filter-btn--active {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.5);
  color: #f59e0b;
}

/* ── states ── */
.ranking-loading,
.ranking-error,
.ranking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.95rem;
}

.clear-search-btn {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 0.82rem;
  cursor: pointer;
  font-family: inherit;
}

/* ── table section ── */
.ranking-table-section {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 16px 60px;
}

/* ── leader banner ── */
.ranking-leader-banner {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 28px;
}

.ranking-leader-banner__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.ranking-leader-trophy {
  width: 48px;
  height: 48px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ranking-leader-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.ranking-leader-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #f59e0b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ranking-leader-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-leader-runners {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ranking-leader-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.ranking-leader-tours {
  font-size: 2rem;
  font-weight: 900;
  color: #f59e0b;
  line-height: 1;
}

.ranking-leader-unit {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
}

/* ── runner avatars ── */
.runner-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  cursor: default;
  user-select: none;
  transition: background 0.15s ease;
}

.runner-avatar:hover {
  background: rgba(255, 255, 255, 0.18);
}

.runner-avatar--sm {
  width: 26px;
  height: 26px;
  font-size: 0.6rem;
}

.runner-avatar--xs {
  width: 22px;
  height: 22px;
  font-size: 0.55rem;
}

.runner-avatar--more {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.25);
  font-size: 0.55rem;
}

/* ── podium ── */
.ranking-podium {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  margin-bottom: 40px;
  padding: 0 8px;
}

.podium-slot {
  flex: 1;
  max-width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px 0;
  text-align: center;
}

.podium-star { margin-bottom: 2px; }

.podium-medal {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 900;
  flex-shrink: 0;
}

.podium-medal--gold   { background: #f59e0b; color: #1a1200; }
.podium-medal--silver { background: #94a3b8; color: #1a1f36; }
.podium-medal--bronze { background: #b45309; color: #fff; }

.podium-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  word-break: break-word;
  line-height: 1.2;
}

.podium-runners {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 2px 0;
}

.podium-tours {
  font-size: 0.72rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.75);
}

.podium-dist {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.35);
}

.podium-bar {
  width: 100%;
  border-radius: 6px 6px 0 0;
  margin-top: 8px;
}

.podium-bar--gold   { background: linear-gradient(180deg, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.1) 100%); height: 80px; }
.podium-bar--silver { background: linear-gradient(180deg, rgba(148,163,184,0.3) 0%, rgba(148,163,184,0.05) 100%); height: 55px; }
.podium-bar--bronze { background: linear-gradient(180deg, rgba(180,83,9,0.3) 0%, rgba(180,83,9,0.05) 100%); height: 35px; }

.podium-slot--1 { order: 2; }
.podium-slot--2 { order: 1; }
.podium-slot--3 { order: 3; }

/* ── search results label ── */
.search-results-label {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 12px;
  padding: 0 2px;
}

/* ── ranking list ── */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 48px 1fr minmax(60px, 180px) 68px 88px;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 12px 16px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.ranking-row:hover { background: rgba(255, 255, 255, 0.06); }

.ranking-row--gold   { background: rgba(245, 158, 11, 0.06); border-color: rgba(245, 158, 11, 0.25); }
.ranking-row--silver { background: rgba(148, 163, 184, 0.05); border-color: rgba(148, 163, 184, 0.2); }
.ranking-row--bronze { background: rgba(180, 83, 9, 0.05); border-color: rgba(180, 83, 9, 0.2); }

/* rank */
.ranking-row__rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-medal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 800;
}

.rank-medal--gold   { background: #f59e0b; color: #1a1200; }
.rank-medal--silver { background: #94a3b8; color: #1a1f36; }
.rank-medal--bronze { background: #b45309; color: #fff; }

.rank-number {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  width: 32px;
  text-align: center;
}

/* info */
.ranking-row__info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.ranking-row__name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ranking-row__name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-row__course-tag {
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* runners */
.ranking-row__runners {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.runners-avatars {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}



.ranking-row__no-runners {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.2);
}

/* progress */
.ranking-row__progress-wrap { width: 100%; }

.ranking-row__progress-bar {
  height: 5px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 99px;
  overflow: hidden;
}

.ranking-row__progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
}

.progress-fill--gold {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.45);
}

.progress-fill--gradient {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

/* score */
.ranking-row__score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.ranking-row__tours {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.ranking-row__tours-label {
  font-size: 0.63rem;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ranking-row__distance {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
}

/* footer */
.ranking-footer {
  display: flex;
  justify-content: center;
  padding-top: 28px;
}

/* ── responsive ── */
@media (max-width: 640px) {
  .ranking-row {
    grid-template-columns: 38px 1fr 58px;
    gap: 8px;
    padding: 10px 12px;
  }

  .ranking-row__progress-wrap,
  .ranking-row__distance {
    display: none;
  }

  .runners-names { display: none; }

  .ranking-hero__meta { gap: 16px; }
  .ranking-podium { display: none; }
}
</style>
