<template>
  <v-app :theme="themeStore.isDark ? 'dark' : 'light'">
    <div class="login-page" :class="{ 'login-dark': themeStore.isDark }">
      <!-- Theme toggle top right -->
      <v-btn
        icon
        size="small"
        class="theme-toggle"
        :title="themeStore.isDark ? 'Mode clair' : 'Mode sombre'"
        @click="themeStore.toggle()"
        variant="tonal"
      >
        <v-icon>{{ themeStore.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <div class="login-container">
        <!-- Left decorative panel -->
        <div class="login-side d-none d-md-flex">
          <div class="login-side-content">
            <v-icon size="64" color="white" class="mb-4">mdi-timer-outline</v-icon>
            <h2 class="text-h4 font-weight-black text-white mb-3">24h INSA</h2>
            <p class="text-body-1" style="color: rgba(255,255,255,0.75); max-width: 280px;">
              Plateforme de gestion des transpondeurs et équipes pour les 24h INSA Lyon.
            </p>
            <div class="login-dots mt-6">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Right form panel -->
        <div class="login-form-panel">
          <div class="login-form-inner">
            <!-- Mobile logo -->
            <div class="d-md-none text-center mb-8">
              <v-icon size="48" color="red-darken-2">mdi-timer-outline</v-icon>
              <div class="text-h5 font-weight-black mt-2">24h INSA</div>
            </div>

            <div class="mb-8">
              <h1 class="text-h5 font-weight-black mb-1">Bienvenue 👋</h1>
              <p class="text-body-2 text-medium-emphasis">Connectez-vous à votre espace</p>
            </div>

          <v-form @submit.prevent="handleLogin" v-model="formValid">
            <div class="field-label">Email</div>
            <v-text-field
              v-model="email"
              name="email"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              variant="outlined"
              density="comfortable"
              placeholder="admin@bce.fr"
              :rules="[v => !!v || 'Email requis', v => /.+@.+\..+/.test(v) || 'Email invalide']"
              required
              class="mb-1"
            />

            <div class="field-label mt-2">Mot de passe</div>
            <v-text-field
              v-model="password"
              name="password"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              placeholder="••••••••"
              :rules="[v => !!v || 'Mot de passe requis']"
              required
            />

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mt-3 mb-2"
              density="compact"
              rounded="lg"
            >
              {{ error }}
            </v-alert>

            <v-btn
              type="submit"
              color="red-darken-2"
              size="large"
              block
              class="mt-5 font-weight-bold login-btn"
              :loading="loading"
              :disabled="!formValid || loading"
              rounded="lg"
              elevation="0"
            >
              Se connecter
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-form>

          <p class="text-caption text-medium-emphasis text-center mt-6">
            Édition 2026 · Gestion Transpondeurs INSA
          </p>
        </div>
      </div>
    </div>
  </div>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'

definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const themeStore = useThemeStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const formValid = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!formValid.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      // Use navigateTo (Nuxt) instead of router.push so the middleware
      // re-evaluates after the cookie is fully committed — fixes double-click bug
      await navigateTo('/')
    }
  } catch (e) {
    error.value = e.message || 'Identifiants invalides'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: #f5f6fa;
  transition: background 0.3s;
}

.login-page.login-dark {
  background: #0f172a;
}

.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
}

.login-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.login-side {
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #b71c1c 0%, #1a1f36 60%, #0d1117 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-side::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.login-side-content {
  position: relative;
  z-index: 1;
  padding: 48px;
}

.login-dots {
  display: flex;
  gap: 8px;
}

.login-dots span {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.4);
}
.login-dots span:first-child { background: rgba(255,255,255,0.9); }

.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.login-form-inner {
  width: 100%;
  max-width: 380px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.login-dark .field-label {
  color: rgba(255,255,255,0.7);
}

.login-btn {
  height: 48px;
  font-size: 1rem;
  letter-spacing: 0.03em;
}
</style>
