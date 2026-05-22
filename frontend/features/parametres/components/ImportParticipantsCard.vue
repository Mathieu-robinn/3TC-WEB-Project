<template>
  <v-card class="list-card mb-5" rounded="xl" elevation="0">
    <v-toolbar density="comfortable" color="transparent" class="px-2 flex-wrap gap-2">
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">Import participants (CSV)</v-toolbar-title>
      <v-spacer />
      <v-btn
        variant="tonal"
        color="primary"
        size="small"
        rounded="lg"
        prepend-icon="mdi-download"
        @click="downloadTemplate"
      >
        Modèle CSV
      </v-btn>
    </v-toolbar>
    <v-divider />
    <v-card-text class="pa-4">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Importe des participants, équipes et courses dans l'édition sélectionnée. En-têtes reconnus par alias (ordre
        libre). Colonnes obligatoires : Course, Catégorie, Nom, Prénom. Équipe vide → équipe « Solo prénom nom ».
      </p>

      <v-alert v-if="editionId == null" type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
        Sélectionnez une édition ci-dessus pour activer l'import.
      </v-alert>

      <template v-else>
        <div class="text-body-2 mb-3">
          <strong>Édition cible :</strong> {{ editionLabel }}
        </div>

        <v-file-input
          v-model="fileModel"
          label="Fichier CSV"
          accept=".csv,text/csv"
          variant="outlined"
          density="comfortable"
          prepend-icon="mdi-file-delimited"
          show-size
          :disabled="busy"
          @update:model-value="onFileSelected"
        />

        <v-alert v-if="parseError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-3">
          {{ parseError }}
        </v-alert>

        <div v-if="mappingLabels.length" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold mb-2">Colonnes détectées</div>
          <v-chip
            v-for="m in mappingLabels"
            :key="m.field"
            size="small"
            class="mr-1 mb-1"
            variant="tonal"
            color="primary"
          >
            {{ m.header }} → {{ fieldLabel(m.field) }}
          </v-chip>
        </div>

        <div v-if="previewRows.length" class="mb-4 table-scroll-x">
          <div class="text-subtitle-2 font-weight-bold mb-2">
            Aperçu ({{ parsedRows.length }} ligne(s) de données)
          </div>
          <v-table density="compact" class="elevation-0">
            <thead>
              <tr>
                <th>Ligne</th>
                <th>Course</th>
                <th>Catégorie</th>
                <th>Équipe</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Mail</th>
                <th>Tel</th>
                <th>Capitaine</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in previewRows" :key="r.lineNumber">
                <td>{{ r.lineNumber }}</td>
                <td>{{ r.courseName }}</td>
                <td>{{ categoryPreview(r) }}</td>
                <td>{{ previewTeamName(r) }}</td>
                <td>{{ r.lastName }}</td>
                <td>{{ r.firstName }}</td>
                <td>{{ r.email ?? '—' }}</td>
                <td>{{ r.phone ?? '—' }}</td>
                <td>{{ r.isCaptain ? 'Oui' : 'Non' }}</td>
              </tr>
            </tbody>
          </v-table>
          <p v-if="parsedRows.length > previewRows.length" class="text-caption text-medium-emphasis mt-1">
            … et {{ parsedRows.length - previewRows.length }} autre(s) ligne(s).
          </p>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-magnify-scan"
            :disabled="!canSubmit || busy"
            :loading="analyzing"
            @click="runImport(true)"
          >
            Analyser
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-upload"
            :disabled="!canSubmit || busy"
            :loading="importing"
            @click="confirmImportOpen = true"
          >
            Importer
          </v-btn>
        </div>

        <ImportResultPanel v-if="lastResult" :result="lastResult" class="mt-4" />
      </template>
    </v-card-text>

    <v-dialog v-model="confirmImportOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-h6">Confirmer l'import</v-card-title>
        <v-card-text>
          Importer {{ parsedRows.length }} ligne(s) dans l'édition « {{ editionLabel }} » ? Les lignes en erreur
          seront ignorées.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmImportOpen = false">Annuler</v-btn>
          <v-btn color="primary" variant="flat" :loading="importing" @click="runImport(false)">Importer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  csvRowsToImportPayload,
  IMPORT_CSV_TEMPLATE_HEADERS,
  missingRequiredLabels,
  parseCsv,
  type ImportCanonicalField,
  type ImportRow,
} from '~/utils/csvParse'
import { downloadCsv, csvFilename } from '~/utils/csvExport'
import { courseCategoryLabel } from '~/utils/courseDisplay'
import type { CourseCategoryApi, ImportParticipantsResult } from '~/types/api'
import ImportResultPanel from '~/features/parametres/components/ImportResultPanel.vue'

const FIELD_LABELS: Record<ImportCanonicalField, string> = {
  course: 'Course',
  category: 'Catégorie',
  team: 'Équipe',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone',
  captain: 'Capitaine',
}

const props = defineProps<{
  editionId: number | null
  editionLabel: string
}>()

const emit = defineEmits<{
  imported: []
}>()

const api = useApi()
const fileModel = ref<File[]>([])
const parseError = ref<string | null>(null)
const parsedRows = ref<ImportRow[]>([])
const csvRawText = ref<string | null>(null)
const mappingLabels = ref<{ header: string; field: ImportCanonicalField }[]>([])
const analyzing = ref(false)
const importing = ref(false)
const confirmImportOpen = ref(false)
const lastResult = ref<ImportParticipantsResult | null>(null)

const busy = computed(() => analyzing.value || importing.value)
const canSubmit = computed(
  () => props.editionId != null && parsedRows.value.length > 0 && !parseError.value,
)
const previewRows = computed(() => parsedRows.value.slice(0, 15))

function fieldLabel(field: ImportCanonicalField): string {
  return FIELD_LABELS[field]
}

function categoryPreview(r: ImportRow): string {
  return courseCategoryLabel(r.category, r.customCategoryName)
}

function previewTeamName(r: ImportRow): string {
  const t = r.teamName?.trim()
  if (t) return t
  return `Solo ${r.firstName} ${r.lastName}`.trim()
}

function downloadTemplate() {
  downloadCsv(csvFilename('modele_import_participants'), [...IMPORT_CSV_TEMPLATE_HEADERS], [])
}

async function onFileSelected(files: File | File[] | null) {
  parseError.value = null
  parsedRows.value = []
  csvRawText.value = null
  mappingLabels.value = []
  lastResult.value = null

  const file = Array.isArray(files) ? files[0] : files
  if (!file) return

  try {
    const text = await file.text()
    csvRawText.value = text
    const matrix = parseCsv(text)
    const { rows, missingRequired, mappingLabels: labels, categoryErrors } = csvRowsToImportPayload(matrix)
    if (missingRequired.length > 0) {
      parseError.value = `Colonnes manquantes : ${missingRequiredLabels(missingRequired)}.`
      return
    }
    if (categoryErrors.length > 0) {
      parseError.value = categoryErrors.map((e) => `Ligne ${e.line} : ${e.message}`).join(' ')
      return
    }
    if (rows.length === 0) {
      parseError.value = 'Aucune ligne de données trouvée après l’en-tête.'
      return
    }
    mappingLabels.value = labels
    parsedRows.value = rows
  } catch {
    parseError.value = 'Impossible de lire le fichier CSV.'
  }
}

async function runImport(dryRun: boolean) {
  if (props.editionId == null || parsedRows.value.length === 0 || !csvRawText.value) return

  if (dryRun) {
    analyzing.value = true
  } else {
    importing.value = true
    confirmImportOpen.value = false
  }

  try {
    const result = await api.post<ImportParticipantsResult>(
      `/edition/${props.editionId}/import-participants`,
      { dryRun, csvText: csvRawText.value },
    )
    lastResult.value = result
    if (!dryRun) {
      emit('imported')
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string | string[] } }
    const msg = err?.data?.message
    parseError.value = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erreur lors de l’import.')
  } finally {
    analyzing.value = false
    importing.value = false
  }
}
</script>
