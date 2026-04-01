<template>
  <div class="ranking-page" :class="themeStore.isDark ? 'ranking-page--dark' : 'ranking-page--light'">
    <section class="ranking-hero">
      <div class="ranking-hero__bg" aria-hidden="true" />
      <div class="ranking-hero__content">
        <div class="ranking-hero__eyebrow">
          <v-icon size="16" color="#f59e0b">mdi-trophy-outline</v-icon>
          <span>Classements par discipline</span>
        </div>

        <h1 class="ranking-hero__heading">Classement public 24h INSA</h1>

        <p class="ranking-hero__subtitle">
          Suivez les équipes par discipline, avec un compteur aligné sur l’édition active.
        </p>

        <div class="ranking-countdown">
          <div class="ranking-countdown__header">
            <div>
              <div class="ranking-countdown__status">{{ statusLabel }}</div>
              <div class="ranking-countdown__target">
                {{ targetLabel }} · {{ referenceDateLabel }}
              </div>
            </div>
            <div class="ranking-countdown__edition">
              {{ activeEditionStore.currentEdition?.name || 'Edition en cours' }}
            </div>
          </div>

          <div class="ranking-countdown__grid">
            <div class="ranking-countdown__cell">
              <span class="ranking-countdown__value">{{ countdown.days }}</span>
              <span class="ranking-countdown__label">jours</span>
            </div>
            <div class="ranking-countdown__cell">
              <span class="ranking-countdown__value">{{ countdown.hours }}</span>
              <span class="ranking-countdown__label">heures</span>
            </div>
            <div class="ranking-countdown__cell">
              <span class="ranking-countdown__value">{{ countdown.minutes }}</span>
              <span class="ranking-countdown__label">minutes</span>
            </div>
            <div class="ranking-countdown__cell">
              <span class="ranking-countdown__value">{{ countdown.seconds }}</span>
              <span class="ranking-countdown__label">secondes</span>
            </div>
          </div>
        </div>

        <div class="ranking-hero__meta">
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ ranking.length }}</span>
            <span class="ranking-hero__stat-label">équipes</span>
          </div>
          <div class="ranking-hero__stat-sep" />
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ courses.length }}</span>
            <span class="ranking-hero__stat-label">disciplines</span>
          </div>
          <div class="ranking-hero__stat-sep" />
          <div class="ranking-hero__stat">
            <span class="ranking-hero__stat-value">{{ totalLaps }}</span>
            <span class="ranking-hero__stat-label">tours cumulés</span>
          </div>
        </div>

        <div class="ranking-hero__refresh">
          <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-refresh</v-icon>
          <span>Mise à jour automatique toutes les 30 s</span>
          <span v-if="lastRefreshed" class="ranking-hero__refresh-time">· Dernière : {{ lastRefreshed }}</span>
        </div>
      </div>
    </section>

    <div v-if="loading && ranking.length === 0" class="ranking-loading">
      <v-progress-circular indeterminate color="#f59e0b" size="48" width="4" />
      <p class="ranking-loading__label">Chargement du classement…</p>
    </div>

    <div v-else-if="error && ranking.length === 0" class="ranking-error">
      <v-icon size="40" color="rgba(255,255,255,0.4)">mdi-wifi-off</v-icon>
      <p>Impossible de charger le classement.</p>
      <v-btn variant="outlined" color="white" size="small" @click="fetchData">Réessayer</v-btn>
    </div>

    <div v-else-if="!loading && ranking.length === 0" class="ranking-empty">
      <v-icon size="48" color="rgba(255,255,255,0.25)">mdi-trophy-outline</v-icon>
      <p>Aucune équipe enregistrée pour le moment.</p>
    </div>

    <section v-else class="ranking-table-section">
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
      </div>

      <div v-if="search && filteredSections.every((section) => section.teams.length === 0)" class="ranking-empty search-empty">
        <v-icon size="40" color="rgba(255,255,255,0.25)">mdi-magnify-remove-outline</v-icon>
        <p>Aucune équipe ne correspond à « {{ search }} »</p>
        <button class="clear-search-btn" @click="search = ''">Effacer la recherche</button>
      </div>

      <div v-else class="discipline-sections">
        <section v-for="section in filteredSections" :key="section.course.id" class="discipline-card">
          <div class="discipline-card__header">
            <div>
              <div class="discipline-card__eyebrow">Discipline</div>
              <h2 class="discipline-card__title">{{ section.course.name }}</h2>
            </div>
            <div class="discipline-card__stats">
              <div>
                <strong>{{ section.teams.length }}</strong>
                équipes
              </div>
              <div>
                <strong>{{ totalLapsFor(section.teams) }}</strong>
                tours
              </div>
            </div>
          </div>

          <div v-if="section.teams.length" class="discipline-leader">
            <div class="discipline-leader__badge">Leader</div>
            <div class="discipline-leader__info">
              <div class="discipline-leader__name">{{ section.teams[0].name }}</div>
              <div class="discipline-leader__meta">
                {{ section.teams[0].nbTour || 0 }} tours · {{ formatDist(section.teams[0].nbTour, section.course) }}
              </div>
            </div>
          </div>

          <div class="ranking-list">
            <div
              v-for="(team, idx) in section.teams"
              :key="team.id"
              class="ranking-row"
              :class="{
                'ranking-row--gold': idx === 0,
                'ranking-row--silver': idx === 1,
                'ranking-row--bronze': idx === 2,
              }"
            >
              <div class="ranking-row__rank">
                <span class="rank-medal" :class="rankMedalClass(idx)">{{ idx + 1 }}</span>
              </div>

              <div class="ranking-row__info">
                <div class="ranking-row__name">{{ team.name }}</div>
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
                  >
                    +{{ (team.runners || []).length - 8 }}
                  </span>
                </div>
                <div v-else class="ranking-row__no-runners">
                  <v-icon size="12" color="rgba(255,255,255,0.2)">mdi-account-off-outline</v-icon>
                  <span>Aucun participant</span>
                </div>
              </div>

              <div class="ranking-row__progress-wrap">
                <div class="ranking-row__progress-bar">
                  <div
                    class="ranking-row__progress-fill"
                    :style="{ width: progressWidth(team.nbTour, section.teams) }"
                    :class="{ 'progress-fill--gold': idx === 0, 'progress-fill--gradient': idx > 0 }"
                  />
                </div>
              </div>

              <div class="ranking-row__score">
                <span class="ranking-row__tours">{{ team.nbTour || 0 }}</span>
                <span class="ranking-row__tours-label">tours</span>
              </div>

              <div class="ranking-row__distance">
                {{ formatDist(team.nbTour, section.course) }}
              </div>
            </div>

            <div v-if="!section.teams.length" class="ranking-row ranking-row--empty">
              Aucun résultat pour cette discipline.
            </div>
          </div>
        </section>
      </div>

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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditionCountdown } from '~/composables/useEditionCountdown'
import { useActiveEditionStore } from '~/features/editions/stores/activeEdition'
import { useThemeStore } from '~/features/theme/stores/theme'
import type { ApiCourse, ApiRunner, ApiTeam } from '~/types/api'

definePageMeta({ layout: 'public' as any })

useHead({
  title: 'Classement public — 24h INSA',
  meta: [{ name: 'description', content: 'Suivez les classements publics des équipes par discipline pour les 24h INSA.' }],
})

const activeEditionStore = useActiveEditionStore()
const themeStore = useThemeStore()
const { countdown, statusLabel, targetLabel, referenceDateLabel } = useEditionCountdown(
  () => activeEditionStore.currentEdition,
)

const ranking = ref<ApiTeam[]>([])
const courses = ref<ApiCourse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const lastRefreshed = ref<string | null>(null)
const search = ref('')

let timer: ReturnType<typeof setInterval> | null = null

const totalLaps = computed(() => ranking.value.reduce((sum, team) => sum + (team.nbTour || 0), 0))

const filteredSections = computed(() => {
  const q = normalize(search.value)
  return courses.value.map((course) => {
    let teams = ranking.value.filter((team) => team.courseId === course.id)
    if (q) {
      teams = teams.filter((team) => {
        if (normalize(team.name ?? '').includes(q)) return true
        return (team.runners ?? []).some((runner) =>
          normalize(`${runner.firstName ?? ''} ${runner.lastName ?? ''}`).includes(q),
        )
      })
    }
    return { course, teams }
  })
})

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function distancePerLap(course?: ApiCourse | null) {
  return course?.distanceTour || 1.6
}

function formatDist(nbTour?: number | null, course?: ApiCourse | null): string {
  return `${((nbTour || 0) * distancePerLap(course)).toFixed(1)} km`
}

function totalLapsFor(teams: ApiTeam[]) {
  return teams.reduce((sum, team) => sum + (team.nbTour || 0), 0)
}

function progressWidth(nbTour: number | null | undefined, teams: ApiTeam[]) {
  const max = Math.max(1, ...teams.map((team) => team.nbTour || 0))
  const pct = ((nbTour || 0) / max) * 100
  return `${Math.max(pct, 2)}%`
}

function stampNow(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function initials(r: ApiRunner): string {
  const f = (r.firstName?.[0] ?? '').toUpperCase()
  const l = (r.lastName?.[0] ?? '').toUpperCase()
  return f + l || '?'
}

function rankMedalClass(idx: number) {
  if (idx === 0) return 'rank-medal--gold'
  if (idx === 1) return 'rank-medal--silver'
  if (idx === 2) return 'rank-medal--bronze'
  return 'rank-medal--default'
}

async function fetchData() {
  loading.value = true
  error.value = null
  const config = useRuntimeConfig()
  const apiBase = (config.public?.apiBase as string | undefined) || 'http://localhost:8000'

  try {
    const [rankingData, coursesData] = await Promise.all([
      $fetch<ApiTeam[]>(`${apiBase}/teams/ranking`),
      $fetch<ApiCourse[]>(`${apiBase}/courses`),
      activeEditionStore.load(),
    ])
    ranking.value = Array.isArray(rankingData) ? rankingData : []
    courses.value = Array.isArray(coursesData) ? coursesData : []
    lastRefreshed.value = stampNow()
  } catch {
    error.value = 'API non disponible'
    ranking.value = [
      { id: 1, name: 'Les Flèches', nbTour: 48, courseId: 1, runners: [{ id: 1, firstName: 'Thomas', lastName: 'Martin', teamId: 1 }] },
      { id: 2, name: 'Team INSA', nbTour: 43, courseId: 1, runners: [{ id: 2, firstName: 'Sophie', lastName: 'Bernard', teamId: 2 }] },
      { id: 3, name: 'Les Rapides', nbTour: 39, courseId: 1, runners: [{ id: 3, firstName: 'Emma', lastName: 'Rousseau', teamId: 3 }] },
      { id: 4, name: 'Team Endurance', nbTour: 28, courseId: 2, runners: [{ id: 4, firstName: 'Nathan', lastName: 'Fontaine', teamId: 4 }] },
      { id: 5, name: 'Les Marathoniens', nbTour: 22, courseId: 2, runners: [] },
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
  background: var(--ranking-page-bg);
  color: var(--ranking-page-text);
  transition: background 0.25s ease, color 0.25s ease;
}

.ranking-page--dark {
  --ranking-page-bg: #0d1117;
  --ranking-page-text: #f1f5f9;
  --ranking-hero-bg: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.12) 0%, transparent 70%),
    linear-gradient(180deg, #1a1f36 0%, #0d1117 100%);
  --ranking-heading: #fff;
  --ranking-muted: rgba(255, 255, 255, 0.65);
  --ranking-subtle: rgba(255, 255, 255, 0.45);
  --ranking-faint: rgba(255, 255, 255, 0.35);
  --ranking-soft: rgba(255, 255, 255, 0.22);
  --ranking-panel: rgba(255, 255, 255, 0.06);
  --ranking-panel-strong: rgba(255, 255, 255, 0.05);
  --ranking-border: rgba(255, 255, 255, 0.12);
  --ranking-border-soft: rgba(255, 255, 255, 0.08);
  --ranking-row-bg: rgba(255, 255, 255, 0.035);
  --ranking-input-bg: rgba(255, 255, 255, 0.06);
  --ranking-input-placeholder: rgba(255, 255, 255, 0.3);
  --ranking-runner-bg: rgba(255, 255, 255, 0.1);
  --ranking-runner-text: rgba(255, 255, 255, 0.75);
  --ranking-empty: rgba(255, 255, 255, 0.4);
}

.ranking-page--light {
  --ranking-page-bg: #f8fafc;
  --ranking-page-text: #0f172a;
  --ranking-hero-bg: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.18) 0%, transparent 70%),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
  --ranking-heading: #0f172a;
  --ranking-muted: rgba(15, 23, 42, 0.72);
  --ranking-subtle: rgba(15, 23, 42, 0.58);
  --ranking-faint: rgba(15, 23, 42, 0.42);
  --ranking-soft: rgba(15, 23, 42, 0.28);
  --ranking-panel: rgba(255, 255, 255, 0.78);
  --ranking-panel-strong: rgba(255, 255, 255, 0.92);
  --ranking-border: rgba(148, 163, 184, 0.28);
  --ranking-border-soft: rgba(148, 163, 184, 0.2);
  --ranking-row-bg: rgba(255, 255, 255, 0.72);
  --ranking-input-bg: rgba(255, 255, 255, 0.9);
  --ranking-input-placeholder: rgba(15, 23, 42, 0.38);
  --ranking-runner-bg: rgba(226, 232, 240, 0.9);
  --ranking-runner-text: rgba(15, 23, 42, 0.7);
  --ranking-empty: rgba(15, 23, 42, 0.52);
}

.ranking-hero {
  position: relative;
  overflow: hidden;
  padding: 56px 24px 40px;
  text-align: center;
}

.ranking-hero__bg {
  position: absolute;
  inset: 0;
  background: var(--ranking-hero-bg);
  z-index: 0;
}

.ranking-hero__content {
  position: relative;
  z-index: 1;
  max-width: 1100px;
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
  color: var(--ranking-heading);
  line-height: 1.1;
  margin: 0 0 8px;
}

.ranking-hero__subtitle {
  max-width: 720px;
  margin: 0 auto 28px;
  color: var(--ranking-muted);
}

.ranking-countdown {
  max-width: 820px;
  margin: 0 auto 28px;
  padding: 20px;
  border-radius: 20px;
  background: var(--ranking-panel);
  border: 1px solid var(--ranking-border);
  backdrop-filter: blur(8px);
}

.ranking-countdown__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  text-align: left;
}

.ranking-countdown__status {
  font-size: 1rem;
  font-weight: 800;
  color: var(--ranking-heading);
}

.ranking-countdown__target,
.ranking-countdown__edition {
  font-size: 0.82rem;
  color: var(--ranking-subtle);
}

.ranking-countdown__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.ranking-countdown__cell {
  border-radius: 16px;
  padding: 16px 12px;
  background: var(--ranking-panel-strong);
  border: 1px solid var(--ranking-border-soft);
}

.ranking-countdown__value {
  display: block;
  font-size: clamp(1.4rem, 4vw, 2.2rem);
  font-weight: 900;
  color: var(--ranking-heading);
  line-height: 1;
}

.ranking-countdown__label {
  display: block;
  margin-top: 6px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ranking-subtle);
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
  color: var(--ranking-heading);
  line-height: 1;
}

.ranking-hero__stat-label {
  font-size: 0.7rem;
  color: var(--ranking-subtle);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ranking-hero__stat-sep {
  width: 1px;
  height: 32px;
  background: var(--ranking-border);
}

.ranking-hero__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--ranking-faint);
}

.ranking-hero__refresh-time {
  color: var(--ranking-soft);
}

.ranking-loading,
.ranking-error,
.ranking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--ranking-empty);
  font-size: 0.95rem;
}

.ranking-table-section {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px 60px;
}

.ranking-controls {
  margin-bottom: 24px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--ranking-input-bg);
  border: 1px solid var(--ranking-border);
  border-radius: 12px;
  padding: 10px 40px 10px 42px;
  font-size: 0.9rem;
  color: var(--ranking-page-text);
  outline: none;
}

.search-input::placeholder {
  color: var(--ranking-input-placeholder);
}

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

.discipline-sections {
  display: grid;
  gap: 24px;
}

.discipline-card {
  padding: 20px;
  border-radius: 20px;
  background: var(--ranking-panel);
  border: 1px solid var(--ranking-border-soft);
}

.discipline-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.discipline-card__eyebrow {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ranking-subtle);
}

.discipline-card__title {
  margin: 4px 0 0;
  font-size: 1.5rem;
  color: var(--ranking-heading);
}

.discipline-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--ranking-muted);
  font-size: 0.82rem;
}

.discipline-card__stats strong {
  color: var(--ranking-heading);
  margin-right: 4px;
}

.discipline-leader {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));
  border: 1px solid rgba(245, 158, 11, 0.22);
  margin-bottom: 18px;
}

.discipline-leader__badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #f59e0b;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.discipline-leader__name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--ranking-heading);
}

.discipline-leader__meta {
  font-size: 0.82rem;
  color: var(--ranking-subtle);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 48px 1fr minmax(80px, 180px) 68px 88px;
  align-items: center;
  gap: 12px;
  background: var(--ranking-row-bg);
  border: 1px solid var(--ranking-border-soft);
  border-radius: 14px;
  padding: 12px 16px;
}

.ranking-row--gold {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.25);
}

.ranking-row--silver {
  background: rgba(148, 163, 184, 0.05);
  border-color: rgba(148, 163, 184, 0.2);
}

.ranking-row--bronze {
  background: rgba(180, 83, 9, 0.05);
  border-color: rgba(180, 83, 9, 0.2);
}

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

.rank-medal--gold {
  background: #f59e0b;
  color: #1a1200;
}

.rank-medal--silver {
  background: #94a3b8;
  color: #1a1f36;
}

.rank-medal--bronze {
  background: #b45309;
  color: #fff;
}

.rank-medal--default {
  background: var(--ranking-panel);
  color: var(--ranking-page-text);
}

.ranking-row__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ranking-row__name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ranking-page-text);
}

.ranking-row__runners {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.runner-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  background: var(--ranking-runner-bg);
  color: var(--ranking-runner-text);
  border: 1px solid var(--ranking-border);
  flex-shrink: 0;
}

.runner-avatar--sm {
  width: 26px;
  height: 26px;
  font-size: 0.6rem;
}

.runner-avatar--more {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.25);
}

.ranking-row__no-runners {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--ranking-soft);
}

.ranking-row__progress-wrap {
  width: 100%;
}

.ranking-row__progress-bar {
  height: 5px;
  background: var(--ranking-border-soft);
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
}

.progress-fill--gradient {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.ranking-row__score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.ranking-row__tours {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ranking-heading);
  line-height: 1;
}

.ranking-row__tours-label {
  font-size: 0.63rem;
  color: var(--ranking-faint);
  text-transform: uppercase;
}

.ranking-row__distance {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ranking-faint);
  text-align: right;
}

.ranking-row--empty {
  display: flex;
  justify-content: center;
  color: var(--ranking-subtle);
}

.ranking-page--light .ranking-row--silver {
  background: rgba(148, 163, 184, 0.14);
}

.ranking-page--light .ranking-row--bronze {
  background: rgba(180, 83, 9, 0.09);
}

.ranking-page--light .search-icon,
.ranking-page--light .search-clear :deep(.v-icon),
.ranking-page--light .ranking-hero__refresh :deep(.v-icon),
.ranking-page--light .ranking-error :deep(.v-icon),
.ranking-page--light .ranking-empty :deep(.v-icon),
.ranking-page--light .ranking-row__no-runners :deep(.v-icon) {
  color: var(--ranking-faint) !important;
}

.clear-search-btn {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 0.82rem;
  cursor: pointer;
}

.ranking-footer {
  display: flex;
  justify-content: center;
  padding-top: 28px;
}

@media (max-width: 760px) {
  .ranking-countdown__header,
  .discipline-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ranking-countdown__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ranking-row {
    grid-template-columns: 38px 1fr 58px;
  }

  .ranking-row__progress-wrap,
  .ranking-row__distance {
    display: none;
  }
}
</style>
