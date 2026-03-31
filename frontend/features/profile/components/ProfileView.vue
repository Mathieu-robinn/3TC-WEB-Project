<template>
  <v-container fluid class="pa-0 admin-page profile-page">
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon color="white" size="22">mdi-account-circle-outline</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Mon compte</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">
            {{ subtitle }}
          </p>
        </div>
      </div>
    </div>

    <div class="pa-4 pa-md-6 pt-4">
      <v-card rounded="xl" elevation="0">
        <v-card-text class="pa-4 pa-md-6">
          <v-alert
            type="info"
            variant="tonal"
            rounded="lg"
            class="mb-4"
            :text="isAdmin ? 'En tant qu’administrateur, vous pouvez modifier votre prénom, votre nom et votre mot de passe.' : 'En tant que bénévole, vous pouvez uniquement modifier votre mot de passe.'"
          />

          <v-form @submit.prevent="saveProfile">
            <v-row>
              <v-col v-if="isAdmin" cols="12" md="6">
                <v-text-field
                  v-model="form.firstName"
                  label="Prénom"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col v-if="isAdmin" cols="12" md="6">
                <v-text-field
                  v-model="form.lastName"
                  label="Nom"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.currentPassword"
                  label="Mot de passe actuel"
                  type="password"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.newPassword"
                  label="Nouveau mot de passe"
                  type="password"
                  variant="outlined"
                  density="comfortable"
                  hint="Au moins 8 caractères"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-end">
              <v-btn color="primary" rounded="lg" type="submit" :loading="saving">
                Enregistrer
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" rounded="lg" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/features/auth/stores/auth'

type UserRole = 'ADMIN' | 'BENEVOLE'
type ProfileResponse = {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
}

const authStore = useAuthStore()
const api = useApi()
const router = useRouter()
const saving = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' as string })
const form = reactive({
  firstName: '',
  lastName: '',
  currentPassword: '',
  newPassword: '',
})

const currentRole = computed<UserRole | ''>(() => (authStore.user?.role as UserRole | undefined) ?? '')
const isAdmin = computed(() => currentRole.value === 'ADMIN')
const subtitle = computed(() =>
  isAdmin.value
    ? 'Mettez à jour vos informations personnelles et votre mot de passe.'
    : 'Vous pouvez uniquement changer votre mot de passe.',
)

function showSnackbar(text: string, color: string) {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function syncFormFromStore() {
  form.firstName = authStore.user?.firstName ?? ''
  form.lastName = authStore.user?.lastName ?? ''
}

async function loadCurrentUser() {
  await authStore.fetchCurrentUser()
  syncFormFromStore()
}

async function saveProfile() {
  if (isAdmin.value && (!form.firstName.trim() || !form.lastName.trim())) {
    showSnackbar('Le prénom et le nom sont requis.', 'error')
    return
  }

  if (form.newPassword && form.newPassword.length < 8) {
    showSnackbar('Le nouveau mot de passe doit faire au moins 8 caractères.', 'error')
    return
  }

  if ((form.currentPassword && !form.newPassword) || (!form.currentPassword && form.newPassword)) {
    showSnackbar('Renseignez le mot de passe actuel et le nouveau mot de passe.', 'error')
    return
  }

  const body: Record<string, unknown> = {}
  const passwordChanged = !!(form.currentPassword && form.newPassword)
  if (isAdmin.value) {
    body.firstName = form.firstName.trim()
    body.lastName = form.lastName.trim()
  }
  if (form.currentPassword && form.newPassword) {
    body.currentPassword = form.currentPassword
    body.newPassword = form.newPassword
  }

  saving.value = true
  try {
    await api.put<ProfileResponse>('/me', body)
    if (passwordChanged) {
      authStore.logout()
      await router.push('/login')
      return
    }

    await authStore.fetchCurrentUser()
    syncFormFromStore()
    form.currentPassword = ''
    form.newPassword = ''
    showSnackbar('Compte mis à jour.', 'success')
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      (Array.isArray(e?.data?.message) ? e.data.message.join(', ') : null) ||
      e?.message ||
      'Erreur lors de la mise à jour du compte'
    showSnackbar(msg, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCurrentUser()
})
</script>

<style scoped>
/* Styles partagés : ~/assets/css/admin-pages.css (.admin-page, .hero-header, etc.) */
</style>
