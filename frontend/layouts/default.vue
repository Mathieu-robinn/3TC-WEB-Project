<template>
  <v-app>
    <!-- Top Navigation Bar -->
    <v-app-bar flat class="top-navbar" height="56" color="white" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <span class="navbar-brand">
        <strong>24h INSA</strong>
        <span class="ml-3 text-body-1 text-medium-emphasis">Gestion Transpondeurs</span>
      </span>
      <v-spacer />
      <span class="text-caption text-medium-emphasis mr-4">Version 1.0</span>
      <v-btn icon size="small" class="mr-1">
        <v-badge color="red" content="3" overlap>
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
      <v-btn icon size="small" class="mr-2">
        <v-icon>mdi-account-circle-outline</v-icon>
      </v-btn>
      <span class="text-body-2 mr-2">Thibault Lefin</span>
      <v-chip color="red" variant="flat" size="small" class="mr-2 font-weight-bold">ADMINISTRATEUR</v-chip>
      <v-btn icon size="small">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer v-model="drawer" rail expand-on-hover permanent class="sidebar-nav" color="#1a1f36">
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          class="sidebar-item"
          active-class="sidebar-active"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="main-content">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(true)

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
  border-bottom: 1px solid #e8e8e8 !important;
  z-index: 1006 !important;
}

.navbar-brand {
  font-size: 1.1rem;
  color: #1a1f36;
}

.sidebar-nav {
  padding-top: 8px;
}

.sidebar-item {
  color: rgba(255, 255, 255, 0.7) !important;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.08) !important;
}

.sidebar-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.12) !important;
}

.main-content {
  background-color: #f5f6fa;
  min-height: 100vh;
}
</style>
