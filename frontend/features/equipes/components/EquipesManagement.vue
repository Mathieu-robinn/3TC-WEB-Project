<template>
  <v-container fluid class="pa-0 admin-page equipes-page">

    <!-- Hero Header -->
    <div class="hero-header pa-4 pa-md-6 pb-4">
      <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3">
        <div>
          <div class="d-flex align-center mb-1">
            <div class="hero-icon-wrap mr-3">
              <v-icon size="22" color="white">mdi-account-group</v-icon>
            </div>
            <h1 class="text-h5 font-weight-bold text-white">Gestion des Équipes</h1>
          </div>
          <p class="text-body-2 text-white-70 ml-0 ml-md-13">{{ store.stats.total }} équipes inscrites • Édition 2026</p>
        </div>
        <div class="d-flex flex-column flex-sm-row flex-wrap w-100 w-md-auto admin-hero-actions">
          <v-btn
            variant="tonal"
            color="white"
            rounded="lg"
            prepend-icon="mdi-refresh"
            class="flex-grow-1 flex-sm-grow-0"
            @click="store.fetchEquipes()"
            :loading="store.loading"
          >
            Actualiser
          </v-btn>
          <v-btn
            v-if="canManageTeams"
            variant="flat"
            color="white"
            rounded="lg"
            prepend-icon="mdi-plus"
            class="text-primary font-weight-bold flex-grow-1 flex-sm-grow-0"
            @click="openCreate()"
          >
            Nouvelle équipe
          </v-btn>
        </div>
      </div>

      <!-- KPI Row -->
      <v-row class="mt-4" density="comfortable">
        <v-col cols="6" sm="3" v-for="kpi in kpis" :key="kpi.label">
          <div class="kpi-chip">
            <div class="kpi-icon" :class="`bg-${kpi.color}-alpha`">
              <v-icon size="16" :color="kpi.color">{{ kpi.icon }}</v-icon>
            </div>
            <div>
              <div class="kpi-value">{{ kpi.value }}</div>
              <div class="kpi-label">{{ kpi.label }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <div class="pa-4 pa-md-6 pt-4">

      <!-- Controls Bar -->
      <v-card class="controls-bar mb-5" rounded="xl" elevation="0">
        <v-card-text class="pa-3">
          <template v-if="isPhoneFilters">
            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model="store.search"
                class="flex-grow-1"
                prepend-inner-icon="mdi-magnify"
                placeholder="Rechercher une équipe..."
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
              <v-btn
                icon
                variant="tonal"
                rounded="lg"
                density="comfortable"
                :aria-expanded="phoneFiltersExpanded"
                aria-label="Afficher ou masquer les filtres"
                @click="togglePhoneFilters"
              >
                <v-icon size="22">{{ phoneFiltersExpanded ? 'mdi-chevron-up' : 'mdi-triangle-small-down' }}</v-icon>
              </v-btn>
            </div>
            <v-expand-transition>
              <div v-show="phoneFiltersExpanded" class="mt-3">
                <v-row density="comfortable" align="center">
                  <v-col cols="12">
                    <v-select
                      v-model="store.filterCourseId"
                      :items="courseFilterItems"
                      item-title="title"
                      item-value="value"
                      label="Discipline"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      rounded="lg"
                      flat
                      clearable
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="store.filterTranspondeur"
                      :items="transponderOptions"
                      item-title="title"
                      item-value="value"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      rounded="lg"
                      flat
                      clearable
                      @update:model-value="(v) => { if (v == null) store.filterTranspondeur = 'tous' }"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="store.sortBy"
                      :items="sortOptions"
                      item-title="title"
                      item-value="value"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      rounded="lg"
                      flat
                      prepend-inner-icon="mdi-sort"
                      clearable
                      @update:model-value="(v) => { if (v == null) store.sortBy = 'ranking' }"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      variant="tonal"
                      color="secondary"
                      rounded="lg"
                      block
                      class="text-none"
                      prepend-icon="mdi-filter-off"
                      @click="store.resetFilters()"
                    >
                      Réinitialiser
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" class="w-100 d-flex">
                      <v-btn value="grid" icon="mdi-view-grid" class="flex-grow-1" />
                      <v-btn value="list" icon="mdi-format-list-bulleted" class="flex-grow-1" />
                      <v-btn value="ranking" icon="mdi-podium" class="flex-grow-1" />
                    </v-btn-toggle>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </template>
          <v-row v-else density="comfortable" align="center">
            <v-col cols="12" md="2">
              <v-text-field
                v-model="store.search"
                prepend-inner-icon="mdi-magnify"
                placeholder="Rechercher une équipe..."
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                clearable
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.filterCourseId"
                :items="courseFilterItems"
                item-title="title"
                item-value="value"
                label="Discipline"
                variant="solo-filled"
                density="compact"
                hide-details
                rounded="lg"
                flat
                clearable
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.filterTranspondeur"
                :items="transponderOptions" item-title="title" item-value="value"
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                clearable
                @update:model-value="(v) => { if (v == null) store.filterTranspondeur = 'tous' }"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-select
                v-model="store.sortBy"
                :items="sortOptions" item-title="title" item-value="value"
                variant="solo-filled" density="compact" hide-details rounded="lg" flat
                prepend-inner-icon="mdi-sort"
                clearable
                @update:model-value="(v) => { if (v == null) store.sortBy = 'ranking' }"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-btn
                variant="tonal"
                color="secondary"
                rounded="lg"
                block
                class="text-none"
                prepend-icon="mdi-filter-off"
                @click="store.resetFilters()"
              >
                Réinitialiser
              </v-btn>
            </v-col>
            <v-col cols="12" sm="4" md="2">
              <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" class="w-100 d-flex">
                <v-btn value="grid" icon="mdi-view-grid" class="flex-grow-1" />
                <v-btn value="list" icon="mdi-format-list-bulleted" class="flex-grow-1" />
                <v-btn value="ranking" icon="mdi-podium" class="flex-grow-1" />
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Loading -->
      <div v-if="store.loading" class="d-flex justify-center align-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="store.error" type="warning" variant="tonal" rounded="xl" class="mb-4">
        {{ store.error }}
      </v-alert>

      <!-- GRID VIEW -->
      <div v-if="!store.loading && viewMode === 'grid'">
        <v-row>
          <v-col v-for="equipe in store.filteredEquipes" :key="equipe.id" cols="12" sm="6" lg="4">
            <v-card class="team-card" rounded="xl" elevation="0" @click="openDetails(equipe)">
              <div class="team-card-accent" :class="statutAccentClass(equipe.statut)"></div>
              <div v-if="canManageTeams && isPhoneFilters" class="team-card__xs-menu" @click.stop>
                <v-menu location="bottom end">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="small" variant="text" color="grey" aria-label="Actions équipe" />
                  </template>
                  <v-list density="compact" rounded="lg" class="pa-1">
                    <v-list-item title="Détails" prepend-icon="mdi-eye" @click="openDetails(equipe)" />
                    <v-list-item title="Modifier" prepend-icon="mdi-pencil" @click="openEdit(equipe)" />
                    <v-list-item title="Supprimer" prepend-icon="mdi-delete" base-color="error" @click="confirmDelete(equipe)" />
                  </v-list>
                </v-menu>
              </div>
              <v-card-text class="pa-5" :class="{ 'team-card__text--compact': isPhoneFilters }">
                <!-- Team header -->
                <div class="d-flex justify-space-between align-start" :class="isPhoneFilters ? 'mb-0' : 'mb-3'">
                  <div class="d-flex align-center flex-grow-1" style="min-width: 0">
                    <v-avatar v-if="!isPhoneFilters" :color="getStatutColor(equipe.statut)" size="40" class="mr-3">
                      <span class="text-body-2 font-weight-bold text-white">
                        {{ (equipe.name || equipe.nom || '?')[0] }}
                      </span>
                    </v-avatar>
                    <div class="flex-grow-1" style="min-width: 0">
                      <div class="text-subtitle-1 font-weight-bold line-clamp-1">{{ equipe.name || equipe.nom }}</div>
                      <template v-if="!isPhoneFilters">
                        <div class="text-caption text-medium-emphasis mt-1">Capitaine: {{ equipe.capitaine || '—' }}</div>
                        <div v-if="courseLabel(equipe.courseId)" class="text-caption text-primary mt-1">{{ courseLabel(equipe.courseId) }}</div>
                      </template>
                      <div v-else class="d-flex align-center ga-2 mt-2 text-body-2">
                        <v-icon :color="equipe.transpondeur ? 'blue' : 'grey'" size="20">
                          mdi-timer{{ equipe.transpondeur ? '' : '-off' }}
                        </v-icon>
                        <span class="font-weight-medium">{{ equipe.transpondeur || 'Aucune puce' }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="!isPhoneFilters" class="d-flex flex-column align-end gap-1">
                    <v-chip :color="getStatutColor(equipe.statut)" size="x-small" variant="flat" class="font-weight-bold">
                      {{ getStatutLabel(equipe.statut) }}
                    </v-chip>
                  </div>
                </div>

                <!-- Stats bar -->
                <template v-if="!isPhoneFilters">
                  <v-divider class="mb-3" />
                  <div class="d-flex justify-space-between text-center">
                    <div>
                      <div class="text-h6 font-weight-bold text-primary">{{ equipe.nbTour || 0 }}</div>
                      <div class="text-caption text-medium-emphasis">Tours</div>
                    </div>
                    <v-divider vertical />
                    <div>
                      <div class="text-h6 font-weight-bold">{{ equipe.membres.length }}</div>
                      <div class="text-caption text-medium-emphasis">Coureurs</div>
                    </div>
                    <v-divider vertical />
                    <div>
                      <v-icon :color="equipe.transpondeur ? 'blue' : 'grey'" size="20">
                        mdi-timer{{ equipe.transpondeur ? '' : '-off' }}
                      </v-icon>
                      <div class="text-caption text-medium-emphasis mt-1">{{ equipe.transpondeur || 'Aucun' }}</div>
                    </div>
                  </div>
                </template>
              </v-card-text>

              <!-- Card actions -->
              <v-card-actions v-if="!isPhoneFilters" class="px-5 pb-4 pt-0" @click.stop>
                <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-eye" @click="openDetails(equipe)">Détails</v-btn>
                <v-spacer />
                <template v-if="canManageTeams">
                  <v-btn size="x-small" icon="mdi-pencil" variant="text" color="grey" @click="openEdit(equipe)" />
                  <v-btn size="x-small" icon="mdi-delete" variant="text" color="error" @click="confirmDelete(equipe)" />
                </template>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Empty state -->
          <v-col cols="12" v-if="!store.filteredEquipes.length">
            <div class="empty-state py-16 d-flex flex-column align-center">
              <v-icon size="56" color="grey" class="mb-4">mdi-clipboard-text-search-outline</v-icon>
              <p class="text-subtitle-1 text-medium-emphasis">Aucune équipe ne correspond aux filtres.</p>
              <v-btn v-if="canManageTeams" class="mt-4" variant="tonal" color="primary" @click="openCreate()">Créer une équipe</v-btn>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- LIST VIEW -->
      <div v-if="!store.loading && viewMode === 'list'">
        <v-card rounded="xl" elevation="0" class="list-card">
          <v-list lines="two" class="pa-0">
            <template v-for="(equipe, i) in store.filteredEquipes" :key="equipe.id">
              <v-list-item class="list-item px-5 py-3" @click="openDetails(equipe)">
                <template v-if="!isPhoneFilters" #prepend>
                  <v-avatar :color="getStatutColor(equipe.statut)" size="44" class="mr-2">
                    <span class="text-body-1 font-weight-bold text-white">{{ (equipe.name || equipe.nom || '?')[0] }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-semibold">{{ equipe.name || equipe.nom }}</v-list-item-title>
                <v-list-item-subtitle v-if="!isPhoneFilters">
                  {{ equipe.capitaine }} · {{ equipe.membres.length }} coureur(s)
                  <template v-if="courseLabel(equipe.courseId)"> · {{ courseLabel(equipe.courseId) }}</template>
                </v-list-item-subtitle>
                <v-list-item-subtitle v-else class="d-flex align-center ga-2">
                  <v-icon size="16" :color="equipe.transpondeur ? 'blue' : 'grey'">
                    mdi-timer{{ equipe.transpondeur ? '' : '-off' }}
                  </v-icon>
                  <span>{{ equipe.transpondeur || 'Aucune puce' }}</span>
                </v-list-item-subtitle>
                <template #append>
                  <div v-if="!isPhoneFilters" class="d-flex align-center list-equipe-append">
                    <div class="list-tours-pill d-flex">
                      <span class="list-tours-pill-value">{{ equipe.nbTour ?? 0 }}</span>
                      <span class="list-tours-pill-label">tours</span>
                    </div>
                    <div class="d-flex align-center gap-2 flex-wrap list-equipe-chips">
                      <v-chip
                        v-if="equipe.transpondeur"
                        color="blue"
                        size="x-small"
                        variant="tonal"
                        prepend-icon="mdi-timer"
                      >
                        {{ equipe.transpondeur }}
                      </v-chip>
                      <v-chip
                        :color="getStatutColor(equipe.statut)"
                        size="x-small"
                        variant="flat"
                        class="font-weight-bold list-status-chip"
                      >
                        {{ getStatutLabel(equipe.statut) }}
                      </v-chip>
                      <template v-if="canManageTeams">
                        <v-btn icon="mdi-pencil" size="x-small" variant="text" color="grey" @click.stop="openEdit(equipe)" />
                        <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click.stop="confirmDelete(equipe)" />
                      </template>
                    </div>
                  </div>
                  <div v-else-if="canManageTeams" class="d-flex align-center" @click.stop>
                    <v-menu location="bottom end">
                      <template #activator="{ props: menuProps }">
                        <v-btn v-bind="menuProps" icon="mdi-dots-vertical" size="small" variant="text" color="grey" aria-label="Actions équipe" />
                      </template>
                      <v-list density="compact" rounded="lg" class="pa-1">
                        <v-list-item title="Détails" prepend-icon="mdi-eye" @click="openDetails(equipe)" />
                        <v-list-item title="Modifier" prepend-icon="mdi-pencil" @click="openEdit(equipe)" />
                        <v-list-item title="Supprimer" prepend-icon="mdi-delete" base-color="error" @click="confirmDelete(equipe)" />
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="i < store.filteredEquipes.length - 1" />
            </template>
            <div v-if="!store.filteredEquipes.length" class="py-10 d-flex flex-column align-center">
              <v-icon size="48" color="grey" class="mb-3">mdi-clipboard-text-search-outline</v-icon>
              <p class="text-medium-emphasis">Aucune équipe trouvée</p>
            </div>
          </v-list>
        </v-card>
      </div>

      <!-- RANKING VIEW -->
      <div v-if="!store.loading && viewMode === 'ranking'">
        <v-card rounded="xl" elevation="0" class="list-card">
          <!-- Podium top 3 -->
          <div class="podium-section pa-5 pb-0" v-if="store.filteredRankingWithDetails.length >= 3">
            <div class="d-flex justify-center align-end gap-4 mb-4">
              <div class="podium-item" v-for="pos in podiumOrder" :key="pos">
                <div class="podium-avatar" :class="`pos-${pos}`">
                  <v-avatar :size="pos === 1 ? 56 : 44" :color="podiumColor(pos)" class="mb-1">
                    <span class="text-body-1 font-weight-bold text-white">{{ (store.filteredRankingWithDetails[pos - 1]?.name || '?')[0] }}</span>
                  </v-avatar>
                  <div class="podium-medal">{{ podiumMedal(pos) }}</div>
                </div>
                <div class="text-caption font-weight-bold text-center pt-1" style="max-width: 80px; word-break: break-word;">
                  {{ store.filteredRankingWithDetails[pos - 1]?.name }}
                </div>
                <div class="text-caption text-primary font-weight-bold text-center">
                  {{ store.filteredRankingWithDetails[pos - 1]?.nbTour }} tours
                </div>
                <div class="podium-block" :class="`block-${pos}`"></div>
              </div>
            </div>
          </div>

          <div class="table-scroll-x">
          <v-table>
            <thead>
              <tr>
                <th class="text-center" style="width:60px">#</th>
                <th>Équipe</th>
                <th class="text-center d-none d-sm-table-cell">Coureurs</th>
                <th class="text-center">Tours</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in store.filteredRankingWithDetails" :key="team.id"
                class="ranking-row" style="cursor: pointer"
                @click="openDetailById(team.id)"
              >
                <td class="text-center">
                  <span v-if="team.rank <= 3" class="text-h6">{{ podiumMedal(team.rank) }}</span>
                  <span v-else class="text-subtitle-2 font-weight-bold text-medium-emphasis">{{ team.rank }}</span>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <v-avatar :color="podiumColor(team.rank)" size="32" class="mr-3">
                      <span class="text-caption font-weight-bold text-white">{{ (team.name || '?')[0] }}</span>
                    </v-avatar>
                    <span class="font-weight-medium">{{ team.name }}</span>
                  </div>
                </td>
                <td class="text-center d-none d-sm-table-cell">
                  <span class="text-body-2 text-medium-emphasis">
                    {{ store.equipesWithStatus.find(e => e.id === team.id)?.membres?.length || 0 }}
                  </span>
                </td>
                <td class="text-center">
                  <v-chip color="primary" size="small" variant="tonal" class="font-weight-bold">{{ team.nbTour }}</v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Details Modal -->
    <EquipeDetailsModal 
      v-if="selectedEquipe"
      v-model="isModalOpen" 
      :equipe="selectedEquipe"
      :can-manage-teams="canManageTeams"
      @edit="openEdit"
      @equipe-updated="onEquipeUpdated"
      @change-captain="onCaptainChange"
    />

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showForm" v-bind="equipeFormDialogAttrs">
      <v-card rounded="xl">
        <div class="form-header pa-5">
          <div class="text-h6 font-weight-bold text-white">{{ editingTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe' }}</div>
          <div class="text-caption text-white" style="opacity:.7">{{ editingTeam ? 'Mettre à jour les infos' : 'Créer une nouvelle équipe' }}</div>
        </div>
        <v-card-text class="pa-5">
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
            {{ formError }}
          </v-alert>
          <v-row>
            <v-col cols="12">
              <div class="field-label">Nom de l'équipe *</div>
              <v-text-field
                v-model="form.name"
                placeholder="Ex: Les Flèches de l'INSA"
                variant="outlined" density="comfortable" rounded="lg"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="6" v-if="!editingTeam">
              <div class="field-label">Numéro *</div>
              <v-text-field
                v-model.number="form.num"
                type="number" placeholder="42"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
            <v-col cols="6" v-if="!editingTeam">
              <div class="field-label">Parcours (courseId) *</div>
              <v-select
                v-model="form.courseId"
                :items="coursesOptions" item-title="label" item-value="id"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
            <v-col cols="12" v-if="editingTeam">
              <div class="field-label">Nb Tours</div>
              <v-text-field
                v-model.number="form.nbTour"
                type="number" placeholder="0"
                variant="outlined" density="comfortable" rounded="lg" hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-5 pb-5 pt-0">
          <v-btn color="grey" variant="text" rounded="lg" @click="showForm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" :loading="store.saving" @click="submitForm">
            {{ editingTeam ? 'Mettre à jour' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm Dialog -->
    <v-dialog v-model="showDeleteConfirm" v-bind="equipeDeleteDialogAttrs">
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-5 text-h6 font-weight-bold">Supprimer l'équipe ?</v-card-title>
        <v-card-text class="px-5">
          <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">
            {{ deleteError }}
          </v-alert>
          Cette action est irréversible. L'équipe <strong>{{ deletingTeam?.name }}</strong> et toutes les données associées seront supprimées.
        </v-card-text>
        <v-card-actions class="pa-5 pt-2">
          <v-btn color="grey" variant="text" rounded="lg" @click="showDeleteConfirm = false">Annuler</v-btn>
          <v-spacer />
          <v-btn color="error" variant="flat" rounded="lg" :loading="store.saving" @click="executeDelete">
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useEquipesStore } from '~/features/equipes/stores/equipes'
import { usePermissions } from '~/composables/usePermissions'
import { useMobileDialogAttrs } from '~/composables/useMobileDialogAttrs'
import { usePhoneFilterExpand } from '~/composables/usePhoneFilterExpand'

const equipeFormDialogAttrs = useMobileDialogAttrs(520)
const equipeDeleteDialogAttrs = useMobileDialogAttrs(420)

const { isPhoneFilters, phoneFiltersExpanded, togglePhoneFilters } = usePhoneFilterExpand()

const store = useEquipesStore()
const { canManageTeams } = usePermissions()

const viewMode = ref('grid')
const isModalOpen = ref(false)
const selectedEquipe = ref(null)
const showForm = ref(false)
const showDeleteConfirm = ref(false)
const editingTeam = ref(null)
const deletingTeam = ref(null)

const coursesOptions = computed(() =>
  store.courses.map((c) => ({ id: c.id, label: `${c.name} (id:${c.id})` })),
)

const courseFilterItems = computed(() => [
  { title: 'Toutes les disciplines', value: null },
  ...store.courses.map((c) => ({ title: c.name, value: c.id })),
])

const courseLabel = (courseId) =>
  courseId != null ? store.courses.find((c) => c.id === courseId)?.name : undefined

const form = reactive({ name: '', num: null, courseId: null, nbTour: 0 })
const formError = ref('')
const deleteError = ref('')
const captainSavingId = ref(null)

async function onCaptainChange({ teamId, runnerId }) {
  if (!canManageTeams.value) return
  if (runnerId == null || teamId == null) return
  const equipe = store.equipesWithStatus.find((e) => e.id === teamId)
  if (!equipe || runnerId === equipe.respRunnerId) return
  captainSavingId.value = teamId
  try {
    await store.updateTeam(teamId, { respRunnerId: runnerId })
    await store.fetchEquipes()
    const fresh = store.equipesWithStatus.find((e) => e.id === teamId)
    if (fresh && selectedEquipe.value?.id === teamId) selectedEquipe.value = fresh
  } catch (e) {
    console.error(e)
  } finally {
    captainSavingId.value = null
  }
}

onMounted(() => {
  store.fetchEquipes()
})

// ── KPIs ──────────────────────────────────────────────────────────────────
const kpis = computed(() => [
  { label: 'Total', value: store.stats.total, icon: 'mdi-account-group', color: 'blue' },
  { label: 'En piste', value: store.stats.enPiste, icon: 'mdi-run', color: 'green' },
  { label: 'Sans puce', value: store.stats.sansPuce, icon: 'mdi-timer-off', color: 'red' },
  { label: 'Terminé', value: store.stats.termine, icon: 'mdi-flag-checkered', color: 'teal' },
])

const podiumOrder = [2, 1, 3]
const transponderOptions = [
  { title: 'Tous', value: 'tous' },
  { title: 'Avec transpondeur', value: 'avec' },
  { title: 'Sans transpondeur', value: 'sans' },
]
const sortOptions = [
  { title: 'Classement', value: 'ranking' },
  { title: 'Nom A→Z', value: 'name' },
  { title: 'Nb coureurs', value: 'members' },
]

// ── CRUD ──────────────────────────────────────────────────────────────────
const openDetails = (equipe) => {
  selectedEquipe.value = equipe
  isModalOpen.value = true
}

const onEquipeUpdated = async (teamId) => {
  await store.fetchEquipes()
  const fresh = store.equipesWithStatus.find((e) => e.id === teamId)
  if (fresh) selectedEquipe.value = fresh
}

const openDetailById = (id) => {
  const equipe = store.equipesWithStatus.find(e => e.id === id)
  if (equipe) openDetails(equipe)
}

const openCreate = () => {
  if (!canManageTeams.value) return
  editingTeam.value = null
  formError.value = ''
  Object.assign(form, { name: '', num: null, courseId: coursesOptions.value[0]?.id ?? null, nbTour: 0 })
  showForm.value = true
}

const openEdit = (equipe) => {
  if (!canManageTeams.value) return
  isModalOpen.value = false
  editingTeam.value = equipe
  formError.value = ''
  Object.assign(form, { name: equipe.name || equipe.nom || '', num: equipe.num, courseId: equipe.courseId, nbTour: equipe.nbTour || 0 })
  showForm.value = true
}

const submitForm = async () => {
  if (!canManageTeams.value) return
  formError.value = ''
  try {
    if (editingTeam.value) {
      await store.updateTeam(editingTeam.value.id, { name: form.name, nbTour: form.nbTour })
    } else {
      await store.createTeam({ num: form.num, name: form.name, courseId: form.courseId })
    }
    showForm.value = false
    await store.fetchEquipes()
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    formError.value = Array.isArray(m) ? m.join(', ') : m || 'Une erreur est survenue'
  }
}

const confirmDelete = (equipe) => {
  if (!canManageTeams.value) return
  deletingTeam.value = equipe
  deleteError.value = ''
  showDeleteConfirm.value = true
}

const executeDelete = async () => {
  if (!canManageTeams.value) return
  deleteError.value = ''
  try {
    await store.deleteTeam(deletingTeam.value.id)
    showDeleteConfirm.value = false
    await store.fetchEquipes()
  } catch (e) {
    const m = e?.data?.message ?? e?.message
    deleteError.value = Array.isArray(m) ? m.join(', ') : m || 'Suppression impossible'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const getStatutColor = (s) =>
  ({
    en_piste: 'green',
    en_attente: 'error',
    sans_transpondeur: 'error',
    terminé: 'teal',
    'aucun membre': 'error',
  }[s] || 'grey')
const getStatutLabel = (s) =>
  ({
    en_piste: 'En piste',
    en_attente: 'Sans puce',
    sans_transpondeur: 'Sans puce',
    terminé: 'Terminé',
    'aucun membre': 'Sans puce',
  }[s] || s)
const statutAccentClass = (s) =>
  ({
    en_piste: 'accent-green',
    en_attente: 'accent-error',
    sans_transpondeur: 'accent-error',
    terminé: 'accent-teal',
    'aucun membre': 'accent-error',
  }[s] || 'accent-grey')

const podiumColor = (rank) => ['amber-darken-2', 'grey-darken-1', 'brown-lighten-1'][rank - 1] || 'blue-grey'
const podiumMedal = (rank) => ['🥇', '🥈', '🥉'][rank - 1] || rank
</script>

<style scoped>
.team-card__xs-menu {
  position: absolute;
  top: 6px;
  right: 4px;
  z-index: 2;
}

.team-card__text--compact {
  padding-bottom: 20px !important;
}

.team-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden;
}
.team-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }

.team-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
.accent-green { background: #34c759; }
.accent-error { background: rgb(var(--v-theme-error)); }
.accent-teal { background: #00897b; }
.accent-grey { background: #8e8e93; }

.list-equipe-append { gap: 14px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.list-tours-pill {
  flex-shrink: 0;
  min-width: 56px;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}
.list-tours-pill-value {
  font-size: 1rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  font-variant-numeric: tabular-nums;
}
.list-tours-pill-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-top: 2px;
}
.list-equipe-chips { max-width: min(100%, 320px); justify-content: flex-end; }
.list-status-chip { margin-left: 4px; }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.list-item { cursor: pointer; transition: background 0.15s; }
.list-item:hover { background: rgba(var(--v-theme-on-surface), 0.04); }

.empty-state { text-align: center; }

/* Podium */
.podium-section { background: transparent; }
.podium-item { display: flex; flex-direction: column; align-items: center; }
.podium-avatar { position: relative; display: flex; flex-direction: column; align-items: center; }
.podium-medal { position: absolute; top: -8px; right: -8px; font-size: 1rem; }

.pos-1 .v-avatar { box-shadow: 0 0 20px rgba(255,193,7,0.4); }
.podium-block {
  width: 80px; border-radius: 4px 4px 0 0;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 8px;
}
.block-1 { height: 60px; }
.block-2 { height: 45px; }
.block-3 { height: 32px; }

.ranking-row:hover { background: rgba(var(--v-theme-on-surface), 0.04); }

.field-label {
  font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
