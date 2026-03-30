<template>
  <v-container fluid class="pa-0 admin-page parametres-page">
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon color="white" size="22">mdi-cog</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Paramètres</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">
            Édition active, structure de l’événement et parcours (disciplines).
          </p>
        </div>
        <div class="d-flex flex-column flex-sm-row flex-wrap gap-2 w-100 w-md-auto">
          <v-btn
            variant="tonal"
            color="white"
            prepend-icon="mdi-refresh"
            rounded="lg"
            class="flex-grow-1 flex-sm-grow-0"
            :loading="refreshingAll"
            @click="refreshAll"
          >
            Actualiser
          </v-btn>
          <template v-if="isAdmin">
            <v-btn
              variant="flat"
              color="white"
              rounded="lg"
              prepend-icon="mdi-calendar-plus"
              class="text-primary font-weight-bold flex-grow-1 flex-sm-grow-0"
              @click="openCreateEditionDialog"
            >
              Nouvelle édition
            </v-btn>
            <v-btn
              variant="flat"
              color="white"
              rounded="lg"
              prepend-icon="mdi-run-fast"
              class="text-primary font-weight-bold flex-grow-1 flex-sm-grow-0"
              :disabled="selectedEditionId == null"
              @click="openCreateCourseDialog"
            >
              Ajouter une course
            </v-btn>
          </template>
        </div>
      </div>

      <v-row class="mt-4">
        <v-col v-for="(kpi, i) in kpis" :key="i" cols="12" sm="6" md="4">
          <div class="kpi-chip">
            <div class="kpi-icon" :class="kpi.iconBg">
              <v-icon size="18" color="white">{{ kpi.icon }}</v-icon>
            </div>
            <div class="min-w-0">
              <div class="kpi-value text-truncate">{{ kpi.value }}</div>
              <div class="kpi-label">{{ kpi.label }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <div class="pa-4 pa-md-6 pt-4">
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact" rounded="lg">{{
        error
      }}</v-alert>
      <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-4" density="compact" rounded="lg">{{
        successMsg
      }}</v-alert>
      <v-alert v-if="createEditionSuccess" type="success" variant="tonal" class="mb-4" density="compact" rounded="lg">{{
        createEditionSuccess
      }}</v-alert>

      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <div class="text-subtitle-2 font-weight-bold mb-2">Édition affichée sur le site</div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Tout le site (équipes, participants, transpondeurs) utilise l’édition marquée comme active.
          </p>

          <div v-if="!isAdmin" class="text-body-2 text-medium-emphasis d-flex align-center">
            <v-icon size="18" class="mr-1">mdi-information-outline</v-icon>
            Contactez un administrateur pour modifier l’édition affichée.
          </div>

          <template v-else>
            <v-row align="end">
              <v-col cols="12" md="8">
                <v-select
                  v-model="selectedEditionId"
                  :items="editionItems"
                  item-title="title"
                  item-value="value"
                  label="Édition à activer"
                  variant="solo-filled"
                  density="compact"
                  flat
                  rounded="lg"
                  :loading="loading"
                  :disabled="loading || saving"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="4" class="d-flex align-end">
                <v-btn
                  color="primary"
                  variant="flat"
                  rounded="lg"
                  block
                  :loading="saving"
                  :disabled="!canApply || saving"
                  @click="applyEdition"
                >
                  Appliquer
                </v-btn>
              </v-col>
            </v-row>
          </template>
        </v-card-text>
      </v-card>

      <template v-if="isAdmin">
        <v-card class="list-card mb-5" rounded="xl" elevation="0">
          <v-toolbar density="comfortable" color="transparent" class="px-2">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">Éditions</v-toolbar-title>
          </v-toolbar>
          <v-divider />
          <div class="pa-2 table-scroll-x">
            <v-data-table
              v-if="activeEditionStore.editions.length"
              :headers="editionTableHeaders"
              :items="activeEditionStore.editions"
              class="elevation-0"
              density="comfortable"
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.startDate="{ item }">
                {{ formatCourseDate(item.startDate) }}
              </template>
              <template #item.endDate="{ item }">
                {{ formatCourseDate(item.endDate) }}
              </template>
              <template #item.active="{ item }">
                <v-chip v-if="item.active" size="small" color="success" variant="flat">Active</v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  aria-label="Modifier l’édition"
                  @click="openEditionEdit(item)"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  color="error"
                  aria-label="Supprimer l’édition"
                  @click="askDeleteEdition(item)"
                />
              </template>
            </v-data-table>
            <div v-else class="text-body-2 text-medium-emphasis pa-4">Aucune édition.</div>
          </div>
        </v-card>

        <v-card class="list-card" rounded="xl" elevation="0">
          <v-toolbar density="comfortable" color="transparent" class="px-2 flex-wrap gap-2">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">Courses</v-toolbar-title>
            <v-select
              v-model="selectedEditionId"
              :items="editionItems"
              item-title="title"
              item-value="value"
              label="Édition"
              variant="solo-filled"
              density="compact"
              flat
              rounded="lg"
              hide-details
              class="edition-toolbar-select"
              style="max-width: 280px"
            />
          </v-toolbar>
          <v-divider />

          <div v-if="selectedEditionId == null" class="text-body-2 text-medium-emphasis pa-6">
            Aucune édition disponible. Créez une édition ou actualisez la page.
          </div>

          <div v-else class="pa-2 table-scroll-x">
            <v-progress-linear v-if="coursesLoading" indeterminate class="mb-2" />

            <v-data-table
              v-else-if="courses.length"
              :headers="courseTableHeaders"
              :items="courses"
              class="elevation-0"
              density="comfortable"
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.distanceTour="{ item }">
                {{ item.distanceTour != null ? String(item.distanceTour) : '—' }}
              </template>
              <template #item.dateAndTime="{ item }">
                {{ formatCourseDate(item.dateAndTime) }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  aria-label="Modifier la course"
                  @click="openCourseEdit(item)"
                />
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="small"
                  color="error"
                  aria-label="Supprimer la course"
                  @click="askDeleteCourse(item)"
                />
              </template>
            </v-data-table>

            <div v-else class="text-body-2 text-medium-emphasis pa-4">Aucune course pour cette édition.</div>

            <v-alert v-if="courseError" type="error" variant="tonal" class="ma-2" density="compact" rounded="lg">{{
              courseError
            }}</v-alert>
            <v-alert v-if="courseSuccess" type="success" variant="tonal" class="ma-2" density="compact" rounded="lg">{{
              courseSuccess
            }}</v-alert>
          </div>
        </v-card>
      </template>
    </div>

    <v-dialog v-model="createEditionDialogOpen" v-bind="paramDialog520" scrollable>
      <v-card rounded="xl">
        <div class="form-header pa-4 d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-calendar-plus</v-icon>
          <span class="text-h6 text-white font-weight-bold">Nouvelle édition</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="createEditionDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="pa-4 pt-4">
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
            :disabled="creatingEdition"
          />
          <v-alert v-if="createEditionError" type="error" variant="tonal" class="mt-3" density="compact">{{
            createEditionError
          }}</v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="createEditionDialogOpen = false">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="creatingEdition"
            :disabled="!canCreateEdition || creatingEdition"
            @click="createEdition"
          >
            Créer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="createCourseDialogOpen" v-bind="paramDialog560" scrollable>
      <v-card rounded="xl">
        <div class="form-header pa-4 d-flex align-center">
          <v-icon color="white" class="mr-2">mdi-run-fast</v-icon>
          <span class="text-h6 text-white font-weight-bold">Nouvelle course</span>
          <v-spacer />
          <v-btn icon variant="text" color="white" @click="createCourseDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-text class="pa-4 pt-4">
          <p v-if="selectedEditionLabel" class="text-body-2 text-medium-emphasis mb-4">
            Édition :
            <strong>{{ selectedEditionLabel }}</strong>
          </p>
          <v-text-field
            v-model="newCourseName"
            label="Nom de la discipline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
            :disabled="creatingCourse"
          />
          <v-text-field
            v-model="newCourseDistance"
            type="number"
            step="any"
            min="0"
            label="Distance par tour (km)"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            hide-details="auto"
            :disabled="creatingCourse"
          />
          <v-text-field
            v-model="newCourseDateTime"
            type="datetime-local"
            label="Date et heure de la course"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="creatingCourse"
          />
          <v-alert v-if="courseError" type="error" variant="tonal" class="mt-3" density="compact">{{ courseError }}</v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="createCourseDialogOpen = false">Annuler</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="creatingCourse"
            :disabled="!canCreateCourse || creatingCourse || selectedEditionId == null"
            @click="createCourse"
          >
            Ajouter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editionEditOpen" v-bind="paramDialog520">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Modifier l’édition</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editionEdit.name"
            label="Nom"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="editionEdit.start"
            type="datetime-local"
            label="Début"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="editionEdit.end"
            type="datetime-local"
            label="Fin"
            variant="outlined"
            density="comfortable"
          />
          <v-alert v-if="editionEditError" type="error" variant="tonal" class="mt-3" density="compact">{{
            editionEditError
          }}</v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="editionEditOpen = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="editionEditSaving" @click="saveEditionEdit">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editionDeleteOpen" v-bind="paramDialog440">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Supprimer cette édition ?</v-card-title>
        <v-card-text v-if="editionDeleteTarget">
          L’édition <strong>{{ editionDeleteTarget.name }}</strong> et les équipes de ses parcours seront
          supprimées. Les transpondeurs liés à cette édition seront aussi supprimés.
          <v-alert
            v-if="editionDeleteError"
            type="error"
            variant="tonal"
            class="mt-3"
            density="compact"
            >{{ editionDeleteError }}</v-alert
          >
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editionDeleteOpen = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" :loading="editionDeleteLoading" @click="confirmDeleteEdition">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="courseEditOpen" v-bind="paramDialog560">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Modifier la course</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="courseEdit.name"
            label="Nom"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="courseEdit.distance"
            type="number"
            step="any"
            min="0"
            label="Distance / tour (km)"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="courseEdit.dateTime"
            type="datetime-local"
            label="Date et heure"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="courseEdit.editionId"
            :items="editionItems"
            item-title="title"
            item-value="value"
            label="Édition"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
          <v-alert v-if="courseEditError" type="error" variant="tonal" class="mt-3" density="compact">{{
            courseEditError
          }}</v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="courseEditOpen = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="courseEditSaving" @click="saveCourseEdit">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="courseDeleteOpen" v-bind="paramDialog420">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Supprimer cette course ?</v-card-title>
        <v-card-text v-if="courseDeleteTarget">
          Les équipes du parcours <strong>{{ courseDeleteTarget.name }}</strong> seront supprimées en cascade.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="courseDeleteOpen = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" :loading="courseDeleteLoading" @click="confirmDeleteCourse">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useDisplay } from 'vuetify/framework'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'
import { useActiveEditionStore } from '~/features/editions/stores/activeEdition'
import type { ApiCourse, ApiEdition } from '~/types/api'

const { isAdmin } = useJwtAuth()
const activeEditionStore = useActiveEditionStore()
const api = useApi()
const display = useDisplay()
const paramDialog520 = useMobileDialogAttrs(520)
const paramDialog560 = useMobileDialogAttrs(560)
const paramDialog440 = useMobileDialogAttrs(440)
const paramDialog420 = useMobileDialogAttrs(420)

const loading = ref(false)
const saving = ref(false)
const refreshingAll = ref(false)
const error = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const createEditionDialogOpen = ref(false)
const createCourseDialogOpen = ref(false)

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

const editionHeadersBase = [
  { title: 'Nom', key: 'name' },
  { title: 'Début', key: 'startDate' },
  { title: 'Fin', key: 'endDate' },
  { title: 'Statut', key: 'active', width: '110px' },
  { title: '', key: 'actions', sortable: false, width: '108px' },
]

const editionTableHeaders = computed(() => {
  if (!display.smAndDown.value) return editionHeadersBase
  return editionHeadersBase.filter((h) => h.key !== 'startDate' && h.key !== 'endDate')
})

const courseHeadersBase = [
  { title: 'Nom', key: 'name' },
  { title: 'Distance / tour (km)', key: 'distanceTour' },
  { title: 'Date et heure', key: 'dateAndTime' },
  { title: '', key: 'actions', sortable: false, width: '108px' },
]

const courseTableHeaders = computed(() => {
  if (!display.smAndDown.value) return courseHeadersBase
  return courseHeadersBase.filter((h) => h.key !== 'distanceTour')
})

const editionEditOpen = ref(false)
const editionEditSaving = ref(false)
const editionEditError = ref<string | null>(null)
const editionEdit = reactive({ id: 0, name: '', start: '', end: '' })
const editionDeleteOpen = ref(false)
const editionDeleteLoading = ref(false)
const editionDeleteError = ref<string | null>(null)
const editionDeleteTarget = ref<ApiEdition | null>(null)

const courseEditOpen = ref(false)
const courseEditSaving = ref(false)
const courseEditError = ref<string | null>(null)
const courseEdit = reactive({
  id: 0,
  name: '',
  distance: '',
  dateTime: '',
  editionId: null as number | null,
})
const courseDeleteOpen = ref(false)
const courseDeleteLoading = ref(false)
const courseDeleteTarget = ref<ApiCourse | null>(null)

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

const kpis = computed(() => {
  const editions = activeEditionStore.editions.length
  const active = activeEditionStore.editions.find((e) => e.active)
  let activeLabel = active?.name ?? 'Aucune'
  if (activeLabel.length > 28) activeLabel = `${activeLabel.slice(0, 28)}…`
  const courseVal = isAdmin.value ? String(courses.value.length) : '—'
  return [
    {
      label: 'Éditions',
      value: String(editions),
      icon: 'mdi-calendar-multiple',
      iconBg: 'bg-blue-alpha',
    },
    {
      label: 'Courses (sélection)',
      value: courseVal,
      icon: 'mdi-run',
      iconBg: 'bg-green-alpha',
    },
    {
      label: 'Édition active',
      value: activeLabel,
      icon: 'mdi-check-decagram',
      iconBg: 'bg-orange-alpha',
    },
  ]
})

function openCreateEditionDialog() {
  createEditionError.value = null
  createEditionSuccess.value = null
  createEditionDialogOpen.value = true
}

function openCreateCourseDialog() {
  if (selectedEditionId.value == null) return
  courseError.value = null
  createCourseDialogOpen.value = true
}

async function refreshAll() {
  refreshingAll.value = true
  error.value = null
  successMsg.value = null
  try {
    await activeEditionStore.load()
    await loadCoursesForSelection()
    await refreshAppData()
  } finally {
    refreshingAll.value = false
  }
}

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

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function openEditionEdit(e: ApiEdition) {
  editionEditError.value = null
  editionEdit.id = e.id
  editionEdit.name = e.name
  editionEdit.start = isoToDatetimeLocal(e.startDate)
  editionEdit.end = isoToDatetimeLocal(e.endDate)
  editionEditOpen.value = true
}

async function saveEditionEdit() {
  if (!editionEdit.name.trim() || !editionEdit.start || !editionEdit.end) return
  const start = new Date(editionEdit.start)
  const end = new Date(editionEdit.end)
  if (end.getTime() <= start.getTime()) {
    editionEditError.value = 'La date de fin doit être après la date de début.'
    return
  }
  editionEditSaving.value = true
  editionEditError.value = null
  try {
    await api.put(`/edition/${editionEdit.id}`, {
      name: editionEdit.name.trim(),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })
    editionEditOpen.value = false
    await activeEditionStore.load()
    await refreshAppData()
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    editionEditError.value = err.response?._data?.message || err.message || 'Impossible d’enregistrer.'
  } finally {
    editionEditSaving.value = false
  }
}

function askDeleteEdition(e: ApiEdition) {
  editionDeleteError.value = null
  editionDeleteTarget.value = e
  editionDeleteOpen.value = true
}

async function confirmDeleteEdition() {
  if (!editionDeleteTarget.value) return
  const deletedId = editionDeleteTarget.value.id
  editionDeleteLoading.value = true
  editionDeleteError.value = null
  try {
    await api.del(`/edition/${deletedId}`)
    editionDeleteOpen.value = false
    editionDeleteTarget.value = null
    await activeEditionStore.load()
    const stillThere = activeEditionStore.editions.some((x) => x.id === selectedEditionId.value)
    if (!stillThere) {
      const active = activeEditionStore.editions.find((ed) => ed.active)
      selectedEditionId.value = active?.id ?? activeEditionStore.editions[0]?.id ?? null
    }
    await loadCoursesForSelection()
    await refreshAppData()
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    editionDeleteError.value = err.response?._data?.message || err.message || 'Suppression impossible.'
  } finally {
    editionDeleteLoading.value = false
  }
}

function openCourseEdit(c: ApiCourse) {
  courseEditError.value = null
  courseEdit.id = c.id
  courseEdit.name = c.name
  courseEdit.distance = c.distanceTour != null ? String(c.distanceTour) : ''
  courseEdit.dateTime = c.dateAndTime ? isoToDatetimeLocal(c.dateAndTime) : ''
  courseEdit.editionId = c.editionId ?? selectedEditionId.value
  courseEditOpen.value = true
}

async function saveCourseEdit() {
  if (!courseEdit.name.trim() || courseEdit.editionId == null) return
  const dist = Number(courseEdit.distance)
  if (!Number.isFinite(dist) || dist < 0 || !courseEdit.dateTime) return
  courseEditSaving.value = true
  courseEditError.value = null
  try {
    await api.put(`/course/${courseEdit.id}`, {
      name: courseEdit.name.trim(),
      distanceTour: dist,
      dateAndTime: new Date(courseEdit.dateTime).toISOString(),
      editionId: courseEdit.editionId,
    })
    courseEditOpen.value = false
    await loadCoursesForSelection()
    await activeEditionStore.load()
    await refreshAppData()
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    courseEditError.value = err.response?._data?.message || err.message || 'Impossible d’enregistrer.'
  } finally {
    courseEditSaving.value = false
  }
}

function askDeleteCourse(c: ApiCourse) {
  courseDeleteTarget.value = c
  courseDeleteOpen.value = true
}

async function confirmDeleteCourse() {
  if (!courseDeleteTarget.value) return
  courseDeleteLoading.value = true
  try {
    await api.del(`/course/${courseDeleteTarget.value.id}`)
    courseDeleteOpen.value = false
    courseDeleteTarget.value = null
    await loadCoursesForSelection()
    await refreshAppData()
  } catch (e: unknown) {
    const err = e as { response?: { _data?: { message?: string } }; message?: string }
    courseError.value = err.response?._data?.message || err.message || 'Suppression impossible.'
  } finally {
    courseDeleteLoading.value = false
  }
}

async function loadCoursesForSelection() {
  if (!isAdmin || selectedEditionId.value == null) {
    courses.value = []
    return
  }
  coursesLoading.value = true
  courseError.value = null
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
    createEditionDialogOpen.value = false
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
    createCourseDialogOpen.value = false
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
.edition-toolbar-select :deep(.v-field) {
  box-shadow: none;
}
</style>
