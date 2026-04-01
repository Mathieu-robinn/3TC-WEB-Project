<template>
  <div class="public-layout" :class="themeStore.isDark ? 'public-layout--dark' : 'public-layout--light'">
    <header class="public-header">
      <div class="public-header__inner">
        <div class="public-header__brand">
          <v-icon color="#e57373" size="24">mdi-timer-outline</v-icon>
          <span class="public-header__title">24h INSA</span>
        </div>
        <div class="public-header__actions">
          <div class="public-header__ranking">
            <v-icon size="16" color="#f59e0b">mdi-trophy-outline</v-icon>
            <span>Classement public</span>
          </div>
          <v-btn
            :icon="themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            variant="text"
            :color="themeStore.isDark ? 'white' : 'grey-darken-3'"
            size="small"
            class="public-header__theme-toggle"
            :title="themeStore.isDark ? 'Mode clair' : 'Mode sombre'"
            @click="themeStore.toggle()"
          />
          <v-btn
            v-if="isLoggedIn"
            to="/dashboard"
            variant="flat"
            color="white"
            class="text-indigo-darken-4 font-weight-bold d-none d-sm-flex"
            prepend-icon="mdi-shield-account"
            size="small"
          >
            Espace Orga
          </v-btn>
          <v-btn
            v-else
            to="/login"
            variant="outlined"
            :color="themeStore.isDark ? 'white' : 'primary'"
            class="d-none d-sm-flex public-header__auth-btn"
            prepend-icon="mdi-login"
            size="small"
          >
            Connexion
          </v-btn>
          <!-- Versions icônes seules sur mobile -->
          <v-btn
            v-if="isLoggedIn"
            to="/dashboard"
            icon="mdi-shield-account"
            variant="flat"
            color="white"
            class="text-indigo-darken-4 d-sm-none"
            size="small"
          />
          <v-btn
            v-else
            to="/login"
            icon="mdi-login"
            variant="outlined"
            :color="themeStore.isDark ? 'white' : 'primary'"
            class="d-sm-none public-header__auth-btn"
            size="small"
          />
        </div>
      </div>
    </header>
    <main class="public-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/features/auth/stores/auth'
import { useThemeStore } from '~/features/theme/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const isLoggedIn = computed(() => !!authStore.user || !!useCookie('auth_token').value)
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  background: var(--public-bg);
  color: var(--public-text);
  display: flex;
  flex-direction: column;
  transition: background 0.25s ease, color 0.25s ease;
}

.public-layout--dark {
  --public-bg: #0d1117;
  --public-text: #f8fafc;
  --public-header-bg: linear-gradient(135deg, #0d1117 0%, #1a1f36 100%);
  --public-header-border: rgba(255, 255, 255, 0.08);
  --public-title-color: #fff;
  --public-ranking-bg: rgba(245, 158, 11, 0.14);
  --public-ranking-border: rgba(245, 158, 11, 0.3);
}

.public-layout--light {
  --public-bg: #f8fafc;
  --public-text: #0f172a;
  --public-header-bg: linear-gradient(135deg, #ffffff 0%, #eef2ff 100%);
  --public-header-border: rgba(15, 23, 42, 0.08);
  --public-title-color: #0f172a;
  --public-ranking-bg: rgba(245, 158, 11, 0.12);
  --public-ranking-border: rgba(245, 158, 11, 0.28);
}

.public-header {
  background: var(--public-header-bg);
  border-bottom: 1px solid var(--public-header-border);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.public-header__inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.public-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.public-header__title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--public-title-color);
  letter-spacing: 0.02em;
}

.public-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.public-header__ranking {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--public-ranking-bg);
  border: 1px solid var(--public-ranking-border);
  border-radius: 20px;
  padding: 4px 12px;
}

.public-header__ranking span {
  font-size: 0.7rem;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.1em;
}

.public-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.public-layout--light .public-header__auth-btn {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(var(--v-theme-primary), 0.45);
}

@media (max-width: 600px) {
  .public-header {
    padding: 0 12px;
  }

  .public-header__inner {
    height: 56px;
  }

  .public-header__actions {
    gap: 8px;
  }

  .public-header__ranking span {
    display: none;
  }

  .public-header__ranking {
    padding: 4px 8px;
  }

  .public-header__theme-toggle {
    margin-right: -4px;
  }
}
</style>
