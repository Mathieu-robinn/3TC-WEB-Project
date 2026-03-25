<template>
  <div class="default-layout">
    <!-- Top Navigation Bar -->
    <v-app-bar flat class="top-navbar" height="56" :color="themeStore.isDark ? 'grey-darken-4' : 'white'" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <span class="navbar-brand">
        <strong>24h INSA</strong>
        <span class="ml-3 text-body-1 text-medium-emphasis">Gestion Transpondeurs</span>
      </span>
      <v-spacer />
      <span class="text-caption text-medium-emphasis mr-4 d-none d-sm-flex">Version 1.0</span>

      <!-- Dark/Light toggle -->
      <v-btn
        icon
        size="small"
        class="mr-1"
        :title="themeStore.isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
        @click="themeStore.toggle()"
      >
        <v-icon>{{ themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <v-btn icon size="small" class="mr-1">
        <v-badge color="red" content="3" overlap>
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>

      <template v-if="authStore.user">
        <v-avatar color="primary" size="30" class="mr-2 cursor-pointer">
          <span class="text-caption font-weight-bold text-white">
            {{ userInitials }}
          </span>
        </v-avatar>
        <div class="d-none d-md-flex flex-column mr-2" style="line-height: 1.1;">
          <span class="text-body-2 font-weight-medium">{{ authStore.user.firstName }} {{ authStore.user.lastName }}</span>
          <span class="text-caption text-medium-emphasis">{{ roleLabel }}</span>
        </div>
        <v-chip :color="roleColor" variant="flat" size="x-small" class="mr-3 font-weight-bold d-none d-sm-flex">
          {{ authStore.user.role }}
        </v-chip>
      </template>

      <v-btn icon size="small" @click="handleLogout" title="Se déconnecter">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      rail
      expand-on-hover
      permanent
      class="sidebar-nav"
      color="#1a1f36"
    >
      <!-- Logo area -->
      <div class="sidebar-logo px-3 py-4 d-flex align-center">
        <v-icon color="red" size="22">mdi-timer-outline</v-icon>
        <span class="ml-3 text-white font-weight-bold text-body-1 sidebar-logo-text">24h INSA</span>
      </div>
      <v-divider color="rgba(255,255,255,0.1)" class="mb-2" />

      <v-list density="compact" nav class="px-2">
        <v-list-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          class="sidebar-item mb-1"
          active-class="sidebar-active"
          rounded="lg"
        />
      </v-list>

      <template #append>
        <v-divider color="rgba(255,255,255,0.1)" class="mb-2" />
        <div class="px-3 pb-3">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Déconnexion"
            class="sidebar-item"
            rounded="lg"
            @click="handleLogout"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main :class="themeStore.isDark ? 'main-content-dark' : 'main-content'">
      <slot />
    </v-main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/features/auth/stores/auth'
import { useThemeStore } from '~/features/theme/stores/theme'
import { useRouter } from 'vue-router'

const drawer = ref(true)
const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const userInitials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase()
})

const roleLabel = computed(() => {
  const roles = { ADMIN: 'Administrateur', BENEVOLE: 'Bénévole' }
  return roles[authStore.user?.role] || authStore.user?.role || ''
})

const roleColor = computed(() => ({
  ADMIN: 'red',
  BENEVOLE: 'blue',
}[authStore.user?.role] || 'grey'))

const navItems = [
  { title: 'Dashboard', icon: 'mdi-home-outline', path: '/' },
  { title: 'Transpondeurs', icon: 'mdi-timer-outline', path: '/transpondeurs' },
  { title: 'Participants', icon: 'mdi-account-outline', path: '/participants' },
  { title: 'Équipes', icon: 'mdi-account-group-outline', path: '/equipes' },
  { title: 'Communication', icon: 'mdi-message-outline', path: '/communication' },
  { title: 'Paramètres', icon: 'mdi-cog-outline', path: '/parametres' },
]
</script>

<style scoped>
.top-navbar {
  border-bottom: 1px solid rgba(0,0,0,0.08) !important;
  z-index: 1006 !important;
}

.navbar-brand {
  font-size: 1.1rem;
}

.sidebar-nav {
  padding-top: 0 !important;
}

.sidebar-logo-text {
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.v-navigation-drawer--is-hovering .sidebar-logo-text,
.v-navigation-drawer:not(.v-navigation-drawer--rail) .sidebar-logo-text {
  opacity: 1;
}

.sidebar-item {
  color: rgba(255, 255, 255, 0.7) !important;
}

.sidebar-item:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.sidebar-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.main-content {
  background-color: #f5f6fa;
  min-height: 100vh;
}

.main-content-dark {
  background-color: #121212;
  min-height: 100vh;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
