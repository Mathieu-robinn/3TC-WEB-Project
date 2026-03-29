<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center mb-6">
      <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-cog-outline</v-icon>
      <h1 class="text-h4 font-weight-bold">Paramètres</h1>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-card rounded="lg" elevation="0" class="border pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-1">Édition active</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Tout le site (équipes, participants, transpondeurs, transactions) affiche uniquement les données
            de l’édition marquée comme active. Seuls les administrateurs peuvent changer l’édition active.
          </p>

          <div v-if="!isAdmin" class="text-body-2 text-medium-emphasis mb-4">
            <v-icon size="18" class="mr-1">mdi-information-outline</v-icon>
            Contactez un administrateur pour modifier l’édition affichée.
          </div>

          <template v-else>
            <v-select
              v-model="selectedEditionId"
              :items="editionItems"
              item-title="title"
              item-value="value"
              label="Édition à activer"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              :loading="loading"
              :disabled="loading || saving"
              hide-details="auto"
            />

            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              :loading="saving"
              :disabled="!canApply || saving"
              @click="applyEdition"
            >
              Appliquer cette édition
            </v-btn>
            <v-alert v-if="error" type="error" variant="tonal" class="mt-4" density="compact">{{ error }}</v-alert>
            <v-alert v-if="successMsg" type="success" variant="tonal" class="mt-4" density="compact">{{
              successMsg
            }}</v-alert>
          </template>
        </v-card>
      </v-col>

      <v-col v-if="isAdmin" cols="12" md="6">
        <v-card rounded="lg" elevation="0" class="border pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-1">Nouvelle édition</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Créez une édition (ex. « 24h INSA 2027 »), puis ajoutez-y des courses ci-dessous après l’avoir
            sélectionnée dans la liste.
          </p>

          <v-text-field
            v-model="newEditionName"
            label="Nom"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
            :disabled="creatingEdition"
          />
          <v-text-field
            v-model="newEditionStart"
            type="datetime-local"
            label="Date et heure de début"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
            :disabled="creatingEdition"
          />
          <v-text-field
            v-model="newEditionEnd"
            type="datetime-local"
            label="Date et heure de fin"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
            :disabled="creatingEdition"
          />
          <v-checkbox
            v-model="activateNewEditionAfterCreate"
            label="Définir comme édition active après création"
            density="comfortable"
            hide-details
            class="mb-2"
            :disabled="creatingEdition"
          />

          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            :loading="creatingEdition"
            :disabled="!canCreateEdition || creatingEdition"
            @click="createEdition"
          >
            Créer l’édition
          </v-btn>
          <v-alert v-if="createEditionError" type="error" variant="tonal" class="mt-4" density="compact">{{
            createEditionError
          }}</v-alert>
          <v-alert v-if="createEditionSuccess" type="success" variant="tonal" class="mt-4" density="compact">{{
            createEditionSuccess
          }}</v-alert>
        </v-card>
      </v-col>

      <v-col v-if="isAdmin" cols="12">
        <v-card rounded="lg" elevation="0" class="border pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-1">Courses (disciplines)</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Les parcours sont rattachés à l’édition choisie dans « Édition à activer » ci-dessus. Sélectionnez
            d’abord l’édition concernée, puis ajoutez les courses une par une.
          </p>

          <div v-if="selectedEditionId == null" class="text-body-2 text-medium-emphasis">
            Aucune édition disponible. Créez une édition ou rechargez la page.
          </div>

          <template v-else>
            <div class="text-body-2 mb-4">
              Édition ciblée :
              <strong>{{ selectedEditionLabel }}</strong>
            </div>

            <v-progress-linear v-if="coursesLoading" indeterminate class="mb-4" />

            <v-table v-else-if="courses.length" density="comfortable" class="border rounded mb-4">
              <thead>
                <tr>
                  <th class="text-left">Nom</th>
                  <th class="text-left">Distance / tour (km)</th>
                  <th class="text-left">Date et heure</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in courses" :key="c.id">
                  <td>{{ c.name }}</td>
                  <td>{{ c.distanceTour != null ? String(c.distanceTour) : '—' }}</td>
                  <td>{{ formatCourseDate(c.dateAndTime) }}</td>
                </tr>
              </tbody>
            </v-table>

            <div v-else class="text-body-2 text-medium-emphasis mb-4">Aucune course pour cette édition pour le moment.</div>

            <v-divider class="mb-4" />

            <div class="text-subtitle-2 font-weight-bold mb-3">Ajouter une course</div>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newCourseName"
                  label="Nom de la discipline"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="creatingCourse"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="newCourseDistance"
                  type="number"
                  step="any"
                  min="0"
                  label="Distance par tour (km)"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="creatingCourse"
                />
              </v-col>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="newCourseDateTime"
                  type="datetime-local"
                  label="Date et heure de la course"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="creatingCourse"
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end mt-2">
              <v-btn
                color="primary"
                variant="flat"
                rounded="lg"
                :loading="creatingCourse"
                :disabled="!canCreateCourse || creatingCourse"
                @click="createCourse"
              >
                Ajouter la course
              </v-btn>
            </div>
            <v-alert v-if="courseError" type="error" variant="tonal" class="mt-4" density="compact">{{ courseError }}</v-alert>
            <v-alert v-if="courseSuccess" type="success" variant="tonal" class="mt-4" density="compact">{{
              courseSuccess
            }}</v-alert>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useActiveEditionStore } from '~/features/editions/stores/activeEdition'
import type { ApiCourse, ApiEdition } from '~/types/api'

const { isAdmin } = useJwtAuth()
const activeEditionStore = useActiveEditionStore()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const selectedEditionId = ref<number | null>(null)

const newEditionName = ref('')
const newEditionStart = ref('')
const newEditionEnd = ref('')
const activateNewEditionAfterCreate = ref(false)
const creatingEdition = ref(false)
const createEditionError = ref<string | null>(null)
const createEditionSuccess = ref<string | null>(null)

const courses = ref<ApiCourse[]>([])
const coursesLoading = ref(false)
const newCourseName = ref('')
const newCourseDistance = ref('')
const newCourseDateTime = ref('')
const creatingCourse = ref(false)
const courseError = ref<string | null>(null)
const courseSuccess = ref<string | null>(null)

const editionItems = computed(() =>
  activeEditionStore.editions.map((e: ApiEdition) => ({
    title: `${e.name}${e.active ? ' (actuelle)' : ''}`,
    value: e.id,
  })),
)

const selectedEditionLabel = computed(() => {
  if (selectedEditionId.value == null) return ''
  const e = activeEditionStore.editions.find((x) => x.id === selectedEditionId.value)
  return e?.name ?? `#${selectedEditionId.value}`
})

const canApply = computed(() => {
  if (selectedEditionId.value == null) return false
  const current = activeEditionStore.editions.find((e) => e.active)
  return current?.id !== selectedEditionId.value
})

const canCreateEdition = computed(() => {
  const name = newEditionName.value.trim()
  return name.length > 0 && newEditionStart.value.length > 0 && newEditionEnd.value.length > 0
})

const canCreateCourse = computed(() => {
  if (selectedEditionId.value == null) return false
  const name = newCourseName.value.trim()
  const dist = Number(newCourseDistance.value)
  return name.length > 0 && Number.isFinite(dist) && dist >= 0 && newCourseDateTime.value.length > 0
})

function formatCourseDate(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

async function loadCoursesForSelection() {
  if (!isAdmin || selectedEditionId.value == null) {
    courses.value = []
    return
  }
  coursesLoading.value = true
  courseError.value = null
  const api = useApi()
  try {
    const list = await api.get<ApiCourse[]>(`/edition/${selectedEditionId.value}/courses`)
    courses.value = Array.isArray(list) ? list : []
  } catch {
    courses.value = []
    courseError.value = 'Impossible de charger les courses pour cette édition.'
  } finally {
    coursesLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  await activeEditionStore.load()
  const active = activeEditionStore.editions.find((e) => e.active)
  selectedEditionId.value = active?.id ?? activeEditionStore.editions[0]?.id ?? null
  loading.value = false
  await loadCoursesForSelection()
})

watch(
  () => activeEditionStore.editions,
  (list) => {
    if (selectedEditionId.value == null && list.length) {
      const active = list.find((e) => e.active)
      selectedEditionId.value = active?.id ?? list[0].id
    }
  },
  { deep: true },
)

watch(selectedEditionId, () => {
  courseSuccess.value = null
  courseError.value = null
  void loadCoursesForSelection()
})

async function applyEdition() {
  if (selectedEditionId.value == null || !canApply.value) return
  saving.value = true
  error.value = null
  successMsg.value = null
  const api = useApi()
  try {
    await api.patch(`/edition/${selectedEditionId.value}/activate`, {})
    await activeEditionStore.load()
    await refreshAppData()
    successMsg.value = 'Édition active mise à jour. Les listes ont été rechargées.'
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    error.value = err.response?._data?.message || err.message || 'Impossible de changer l’édition active.'
  } finally {
    saving.value = false
  }
}

async function createEdition() {
  if (!canCreateEdition.value) return
  creatingEdition.value = true
  createEditionError.value = null
  createEditionSuccess.value = null
  const shouldActivate = activateNewEditionAfterCreate.value
  const api = useApi()
  try {
    const start = new Date(newEditionStart.value)
    const end = new Date(newEditionEnd.value)
    if (end.getTime() <= start.getTime()) {
      createEditionError.value = 'La date de fin doit être après la date de début.'
      return
    }
    const created = await api.post<ApiEdition>('/edition', {
      name: newEditionName.value.trim(),
      active: false,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })
    if (shouldActivate && created?.id != null) {
      await api.patch(`/edition/${created.id}/activate`, {})
      await refreshAppData()
    }
    await activeEditionStore.load()
    selectedEditionId.value = created.id
    newEditionName.value = ''
    newEditionStart.value = ''
    newEditionEnd.value = ''
    activateNewEditionAfterCreate.value = false
    createEditionSuccess.value = shouldActivate
      ? 'Édition créée et activée.'
      : 'Édition créée. Vous pouvez lui ajouter des courses ci-dessous.'
    await loadCoursesForSelection()
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    createEditionError.value = err.response?._data?.message || err.message || 'Impossible de créer l’édition.'
  } finally {
    creatingEdition.value = false
  }
}

async function createCourse() {
  if (!canCreateCourse.value || selectedEditionId.value == null) return
  creatingCourse.value = true
  courseError.value = null
  courseSuccess.value = null
  const api = useApi()
  try {
    await api.post<ApiCourse>('/course', {
      name: newCourseName.value.trim(),
      distanceTour: Number(newCourseDistance.value),
      dateAndTime: new Date(newCourseDateTime.value).toISOString(),
      editionId: selectedEditionId.value,
    })
    newCourseName.value = ''
    newCourseDistance.value = ''
    newCourseDateTime.value = ''
    courseSuccess.value = 'Course ajoutée.'
    await loadCoursesForSelection()
    const wasActiveEdition = activeEditionStore.editions.find((e) => e.id === selectedEditionId.value)?.active
    if (wasActiveEdition) {
      await refreshAppData()
    }
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    courseError.value = err.response?._data?.message || err.message || 'Impossible d’ajouter la course.'
  } finally {
    creatingCourse.value = false
  }
}
</script>

<style scoped>
.border {
  border: 1px solid #e8e8e8 !important;
}
</style>
