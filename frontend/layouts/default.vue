<template>
  <div class="default-layout" :style="layoutCssVars">
    <v-navigation-drawer
      v-model="drawer"
      :rail="!isMobileNav"
      :expand-on-hover="!isMobileNav"
      :permanent="!isMobileNav"
      :temporary="isMobileNav"
      class="sidebar-drawer"
      color="#1a1f36"
    >
      <div class="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__iconCol" aria-hidden="true">
            <v-icon color="#e57373" size="22">mdi-timer-outline</v-icon>
          </div>
          <span class="sidebar__label sidebar__label--brand text-white font-weight-bold">24h INSA</span>
        </div>

        <div v-if="activeEditionStore.name" class="sidebar__edition">
          <v-chip
            size="small"
            variant="tonal"
            color="primary"
            class="sidebar__edition-chip font-weight-medium"
          >
            {{ activeEditionStore.name }}
          </v-chip>
        </div>

        <v-divider class="sidebar__divider" color="rgba(255,255,255,0.1)" />

        <nav class="sidebar__scroll" aria-label="Navigation principale">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="sidebar__row sidebar__link"
            :class="{ 'sidebar__link--active': isNavActive(item.path) }"
          >
            <span class="sidebar__iconCol" aria-hidden="true">
              <template v-if="item.path === '/communication' && commUnreadTotal > 0">
                <v-badge color="error" :content="commUnreadTotal > 99 ? '99+' : commUnreadTotal" overlap>
                  <v-icon size="22" :icon="item.icon" class="sidebar__icon" />
                </v-badge>
              </template>
              <v-icon v-else size="22" :icon="item.icon" class="sidebar__icon" />
            </span>
            <span class="sidebar__label">{{ item.title }}</span>
          </NuxtLink>
        </nav>

        <v-divider class="sidebar__divider" color="rgba(255,255,255,0.1)" />

        <div class="sidebar__footer">
          <NuxtLink v-if="showUserBar" to="/mon-compte" class="sidebar__row sidebar__link sidebar__row--tight">
            <div class="sidebar__iconCol">
              <v-avatar color="primary" size="32">
                <span class="text-caption font-weight-bold text-white">{{ userInitials }}</span>
              </v-avatar>
            </div>
            <div class="sidebar__stack">
              <span class="sidebar__textStrong text-truncate">{{ userDisplayName }}</span>
              <span class="sidebar__textMuted text-truncate">Statut : {{ roleLabel }}</span>
            </div>
          </NuxtLink>

          <v-menu
            v-model="notifMenuOpen"
            :close-on-content-click="false"
            location="end"
            transition="slide-y-transition"
            @update:model-value="onNotifMenuToggle"
          >
            <template #activator="{ props: menuProps }">
              <button type="button" class="sidebar__row sidebar__btn" v-bind="menuProps">
                <span class="sidebar__iconCol">
                  <v-badge
                    v-if="notifUnseen > 0"
                    color="red"
                    :content="notifUnseen > 99 ? '99+' : notifUnseen"
                    overlap
                  >
                    <v-icon size="22" class="sidebar__icon">mdi-bell-outline</v-icon>
                  </v-badge>
                  <v-icon v-else size="22" class="sidebar__icon">mdi-bell-outline</v-icon>
                </span>
                <span class="sidebar__label">Notifications</span>
              </button>
            </template>
            <v-card
              class="notif-menu-card"
              :class="{ 'notif-menu-card--mobile': isMobileNav }"
              :min-width="isMobileNav ? undefined : 400"
              :max-width="isMobileNav ? undefined : 480"
              max-height="560"
            >
              <v-card-title class="text-subtitle-1 py-3">Notifications</v-card-title>
              <v-divider />
              <div class="px-3 pt-2 pb-2 notif-menu-toolbar">
                <div class="notif-toolbar-field">
                  <v-text-field
                    v-model="notifStore.notifSearch"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    placeholder="Rechercher…"
                    prepend-inner-icon="mdi-magnify"
                  />
                </div>
                <div class="notif-toolbar-field">
                  <v-select
                    v-model="notifStore.notifFilter"
                    :items="notifFilterItems"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    label="Filtrer"
                  />
                </div>
                <div class="notif-toolbar-field notif-toolbar-field--last">
                  <v-select
                    v-model="notifStore.notifSortDate"
                    :items="notifSortItems"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    label="Trier par date"
                  />
                </div>
              </div>
              <v-divider />
              <v-card-text class="pa-0 notif-menu-card__body">
                <div v-if="notifStore.loading && !notifStore.items.length" class="pa-4 text-center text-caption text-medium-emphasis">
                  Chargement…
                </div>
                <div v-else-if="!notifStore.items.length" class="pa-4 text-center text-caption text-medium-emphasis">
                  Aucune notification.
                </div>
                <div v-else-if="!notifMenuHasRows" class="pa-4 text-center text-caption text-medium-emphasis">
                  Aucune notification ne correspond à ces critères.
                </div>
                <template v-else>
                  <div v-if="notifSections.emergencyList.length" class="px-3 pt-3">
                    <div class="text-caption font-weight-bold text-error mb-2">Urgence</div>
                    <NotifMenuItems
                      :items="notifSections.emergencyList"
                      :is-dark="themeStore.isDark"
                      emphasis="error"
                      @seen="notifStore.markSeen"
                      @processed="notifStore.markProcessed"
                    />
                  </div>
                  <div v-if="notifSections.alertList.length" class="px-3 pt-2">
                    <div class="text-caption font-weight-bold text-orange-darken-3 mb-2">Alerte</div>
                    <NotifMenuItems
                      :items="notifSections.alertList"
                      :is-dark="themeStore.isDark"
                      emphasis="warning"
                      @seen="notifStore.markSeen"
                      @processed="notifStore.markProcessed"
                    />
                  </div>
                  <div v-if="notifSections.infoList.length" class="px-3 pt-2 pb-3">
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2">Information</div>
                    <NotifMenuItems
                      :items="notifSections.infoList"
                      :is-dark="themeStore.isDark"
                      emphasis="muted"
                      @seen="notifStore.markSeen"
                      @processed="notifStore.markProcessed"
                    />
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-menu>

          <button type="button" class="sidebar__row sidebar__btn" @click="themeStore.toggle()">
            <span class="sidebar__iconCol">
              <v-icon size="22" class="sidebar__icon">
                {{ themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
              </v-icon>
            </span>
            <span class="sidebar__label">{{ themeStore.isDark ? 'Mode clair' : 'Mode sombre' }}</span>
          </button>

          <button type="button" class="sidebar__row sidebar__btn" @click="handleLogout">
            <span class="sidebar__iconCol">
              <v-icon size="22" class="sidebar__icon">mdi-logout</v-icon>
            </span>
            <span class="sidebar__label">Déconnexion</span>
          </button>
        </div>
      </div>
    </v-navigation-drawer>

    <header
      v-if="isMobileNav"
      class="mobile-top-bar"
      :class="themeStore.isDark ? 'mobile-top-bar--dark' : 'mobile-top-bar--light'"
    >
      <v-btn
        icon="mdi-menu"
        variant="text"
        color="white"
        aria-label="Ouvrir le menu"
        @click="drawer = true"
      />
      <span class="mobile-top-bar__title text-body-1 font-weight-bold text-truncate">{{ pageTitle }}</span>
    </header>

    <v-main
      class="layout-main"
      :class="[
        themeStore.isDark ? 'main-content-dark' : 'main-content',
        { 'layout-main--mobile-bar': isMobileNav },
      ]"
    >
      <slot />
    </v-main>

    <NotificationToastStack v-if="isAdmin" />
    <NotificationFab v-if="showUserBar" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { MOBILE_TOP_BAR_PX } from '~/composables/useMobileNav'
import { useDisplay } from 'vuetify/framework'
import { useCommunicationStore } from '~/features/communication/stores/communication.store'
import { useNotificationsStore } from '~/features/notifications/stores/notifications.store'
import NotificationToastStack from '~/features/notifications/components/NotificationToastStack.vue'
import NotificationFab from '~/features/notifications/components/NotificationFab.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/stores/auth'
import { useThemeStore } from '~/features/theme/stores/theme'
import { useActiveEditionStore } from '~/features/editions/stores/activeEdition'

const display = useDisplay()
const isMobileNav = computed(() => display.mdAndDown.value)

const drawer = ref(true)
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const activeEditionStore = useActiveEditionStore()
const router = useRouter()
const { isAdmin, payload: jwtPayload, token } = useJwtAuth()
const commStore = useCommunicationStore()
const notifStore = useNotificationsStore()
const notifMenuOpen = ref(false)
const commUnreadTotal = computed(() => commStore.totalUnreadCount)
const notifUnseen = computed(() => notifStore.unseenCount)
const notifSections = computed(() => notifStore.sectionLists)
const notifMenuHasRows = computed(() => {
  const s = notifSections.value
  return s.emergencyList.length + s.alertList.length + s.infoList.length > 0
})

const notifFilterItems = [
  { title: 'Toutes', value: 'all' },
  { title: 'Non traitées', value: 'unprocessed' },
  { title: 'Non vues', value: 'unseen' },
  { title: 'Urgences', value: 'emergency' },
  { title: 'Alertes', value: 'alert' },
]
const notifSortItems = [
  { title: 'Plus récentes d’abord', value: 'desc' },
  { title: 'Plus anciennes d’abord', value: 'asc' },
]

function onNotifMenuToggle(open) {
  if (open) {
    void notifStore.fetchNotifications()
  }
}

watch(
  () => commStore.socket,
  (s) => {
    if (s) notifStore.bindSocket(s)
  },
  { immediate: true },
)

function isNavActive(path) {
  if (path === '/') return route.path === '/'
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path === path || route.path.startsWith(`${path}/`)
}

onMounted(async () => {
  activeEditionStore.load()
  await authStore.hydrateUserFromToken()
  const authToken = useCookie('auth_token')
  if (authToken.value) {
    commStore.initSocket()
    await commStore.fetchConversations()
    await notifStore.fetchNotifications()
  }
})

const handleLogout = () => {
  notifStore.unbindSocket()
  commStore.disconnectSocket()
  authStore.logout()
  router.push('/login')
}

const showUserBar = computed(() => !!(authStore.user || token.value))

const effectiveRole = computed(() => authStore.user?.role ?? jwtPayload.value?.role ?? '')

const userDisplayName = computed(() => {
  const u = authStore.user
  const fn = u?.firstName?.trim()
  const ln = u?.lastName?.trim()
  if (fn || ln) return `${fn || ''} ${ln || ''}`.trim()
  return '…'
})

const userInitials = computed(() => {
  const u = authStore.user
  if (u?.firstName || u?.lastName) {
    return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase()
  }
  const em = jwtPayload.value?.email
  if (em) return em.slice(0, 2).toUpperCase()
  return '?'
})

const roleLabel = computed(() => {
  const roles = { SUPER_ADMIN: 'Super admin', ADMIN: 'Administrateur', BENEVOLE: 'Bénévole' }
  return roles[effectiveRole.value] || effectiveRole.value || ''
})

const allNavItems = [
  { title: 'Classement public', icon: 'mdi-trophy-outline', path: '/', adminOnly: false },
  { title: 'Dashboard', icon: 'mdi-home-outline', path: '/dashboard', adminOnly: false },
  { title: 'Transpondeurs', icon: 'mdi-timer-outline', path: '/transpondeurs', adminOnly: false },
  { title: 'Participants', icon: 'mdi-account-outline', path: '/participants', adminOnly: false },
  { title: 'Équipes', icon: 'mdi-account-group-outline', path: '/equipes', adminOnly: false },
  { title: 'Communication', icon: 'mdi-message-outline', path: '/communication', adminOnly: false },
  { title: 'Comptes', icon: 'mdi-account-supervisor-outline', path: '/comptes', adminOnly: true },
  { title: 'Logs', icon: 'mdi-text-box-outline', path: '/logs', adminOnly: true },
  { title: 'Paramètres', icon: 'mdi-cog-outline', path: '/parametres', adminOnly: true },
]

const navItems = computed(() => allNavItems.filter((item) => !item.adminOnly || isAdmin.value))

const pageTitle = computed(() => {
  const found = navItems.value.find((item) => isNavActive(item.path))
  return found?.title ?? '24h INSA'
})

/** Espace réservé en haut du viewport (barre mobile + encoche) — hérité par le contenu (ex. communication). */
const layoutCssVars = computed(() => ({
  '--layout-mobile-top': isMobileNav.value
    ? `calc(${MOBILE_TOP_BAR_PX}px + env(safe-area-inset-top, 0px))`
    : '0px',
}))

watch(
  isMobileNav,
  (mobile) => {
    drawer.value = !mobile
  },
  { immediate: true },
)

watch(
  () => route.path,
  () => {
    if (isMobileNav.value) drawer.value = false
  },
)
</script>

<style scoped>
/* --- Drawer : structure flex --- */
.sidebar-drawer {
  padding-top: 0 !important;
}

.sidebar-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Une seule colonne d’icônes pour toute la barre */
.sidebar__iconCol {
  width: 40px;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.sidebar__label--brand {
  font-size: 1rem;
}

.sidebar__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 6px 8px;
  margin: 2px 0;
  border-radius: 10px;
  box-sizing: border-box;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  cursor: default;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar__row--tight {
  align-items: center;
  cursor: default;
}

.sidebar__link {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.75);
}

.sidebar__link:hover,
.sidebar__btn:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.98);
}

.sidebar__link--active {
  background-color: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.sidebar__link--active .sidebar__icon {
  color: #fff !important;
}

.sidebar__btn {
  cursor: pointer;
  font: inherit;
}

.sidebar__row--muted {
  pointer-events: none;
  opacity: 1;
}

.sidebar__icon {
  color: rgba(255, 255, 255, 0.88) !important;
  opacity: 1;
}

.sidebar__iconDim {
  color: rgba(255, 255, 255, 0.4) !important;
}

.sidebar__textStrong {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  display: block;
}

.sidebar__textMuted {
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  display: block;
}

.sidebar__stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 8px 10px;
  flex-shrink: 0;
}

.sidebar__edition {
  padding: 0 8px 8px;
  flex-shrink: 0;
}

.sidebar__edition-chip {
  max-width: 100%;
}

.sidebar__divider {
  flex-shrink: 0;
  margin: 0 4px !important;
  opacity: 0.9;
}

/* Scroll : marge latérale pour que les fonds arrondis ne soient pas coupés */
.sidebar__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px 6px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

/* Chrome, Edge, Safari */
.sidebar__scroll::-webkit-scrollbar {
  display: none;
}

.sidebar__footer {
  flex-shrink: 0;
  padding: 6px 6px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Rail replié : masquer les libellés (pas opacity — pas de place fantôme) */
.sidebar-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .sidebar__label,
.sidebar-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .sidebar__stack,
.sidebar-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .sidebar__edition {
  display: none;
}

.sidebar-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .sidebar__brand,
.sidebar-drawer.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .sidebar__row {
  justify-content: center;
  gap: 0;
}

/* Barre mobile (hors chaîne v-app car layout enveloppé dans un div) */
.mobile-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1005;
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 56px;
  padding: env(safe-area-inset-top, 0px) 8px 0 max(8px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
}

.mobile-top-bar--light {
  background: linear-gradient(135deg, #1a1f36 0%, #2d3561 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.mobile-top-bar--dark {
  background: #1a1f36;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.mobile-top-bar__title {
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.95);
}

.layout-main {
  padding-top: 0 !important;
}

.layout-main--mobile-bar {
  padding-top: calc(var(--layout-mobile-top)) !important;
}

.main-content {
  background-color: #f5f6fa;
  min-height: 100vh;
}

.main-content-dark {
  background-color: #121212;
  min-height: 100vh;
}

.notif-menu-card__body {
  max-height: 340px;
  overflow-y: auto;
}

/* Évite le chevauchement des labels flottants entre Filtrer / Trier */
.notif-menu-toolbar {
  display: flex;
  flex-direction: column;
}

.notif-menu-toolbar .notif-toolbar-field {
  width: 100%;
  margin-bottom: 16px;
}

.notif-menu-toolbar .notif-toolbar-field--last {
  margin-bottom: 0;
}

.notif-menu-card--mobile {
  width: min(480px, calc(100vw - 24px)) !important;
  max-width: calc(100vw - 24px) !important;
  min-width: 0 !important;
}
</style>
