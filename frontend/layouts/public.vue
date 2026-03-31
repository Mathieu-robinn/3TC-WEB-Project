<template>
  <div class="public-layout">
    <header class="public-header">
      <div class="public-header__inner">
        <div class="public-header__brand">
          <v-icon color="#e57373" size="24">mdi-timer-outline</v-icon>
          <span class="public-header__title">24h INSA</span>
        </div>
        <div class="public-header__actions">
          <div class="public-header__live">
            <span class="live-dot" />
            <span class="live-label">EN DIRECT</span>
          </div>
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
            color="white"
            class="d-none d-sm-flex"
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
            color="white"
            class="d-sm-none"
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

const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.user || !!useCookie('auth_token').value)
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  background: #0d1117;
  display: flex;
  flex-direction: column;
}

.public-header {
  background: linear-gradient(135deg, #0d1117 0%, #1a1f36 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #fff;
  letter-spacing: 0.02em;
}

.public-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.public-header__live {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 20px;
  padding: 4px 12px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.live-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 0.1em;
}

.public-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
