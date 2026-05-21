<template>
  <div class="transponder-row-actions d-flex flex-wrap ga-1" :class="{ 'justify-end': !compact }">
    <template v-if="canLinkTransponderToTeam">
      <v-btn
        v-if="item.status === 'INITIALISE'"
        icon
        variant="text"
        :size="btnSize"
        color="primary"
        title="Lier à une équipe"
        @click="emit('link', item)"
      >
        <v-icon :size="iconSize">mdi-link-variant</v-icon>
      </v-btn>
    </template>
    <template v-if="canUnlinkTransponderFromTeam">
      <v-btn
        v-if="item.status === 'EN_ATTENTE' && item.team"
        icon
        variant="text"
        :size="btnSize"
        color="grey"
        title="Délier de l'équipe"
        :loading="saving"
        @click="emit('unlink', item)"
      >
        <v-icon :size="iconSize">mdi-link-off</v-icon>
      </v-btn>
    </template>
    <template v-if="canOperateTransponders">
      <v-btn
        v-if="item.status === 'EN_ATTENTE' && item.team"
        icon
        variant="text"
        :size="btnSize"
        color="primary"
        title="Marquer comme donné"
        @click="emit('give', item)"
      >
        <v-icon :size="iconSize">mdi-hand-extended</v-icon>
      </v-btn>
      <v-btn
        v-if="item.status === 'DONNE'"
        icon
        variant="text"
        :size="btnSize"
        color="warning"
        title="Récupérer le transpondeur (fin de course)"
        :loading="saving"
        @click="emit('unassign', item)"
      >
        <v-icon :size="iconSize">mdi-arrow-u-left-bottom</v-icon>
      </v-btn>
      <v-btn
        v-if="item.status === 'DONNE'"
        icon
        variant="text"
        :size="btnSize"
        color="deep-orange"
        title="Déclarer défaillant (retire la puce de l'équipe)"
        :loading="saving"
        @click="emit('defective', item)"
      >
        <v-icon :size="iconSize">mdi-flash-alert</v-icon>
      </v-btn>
      <v-btn
        v-if="item.status === 'DONNE'"
        icon
        variant="text"
        :size="btnSize"
        color="red"
        title="Déclarer perdu"
        :loading="saving"
        @click="emit('lost', item)"
      >
        <v-icon :size="iconSize">mdi-alert-circle</v-icon>
      </v-btn>
    </template>
    <template v-if="canRestockTransponder">
      <v-btn
        v-if="item.status === 'DEFAILLANT'"
        icon
        variant="text"
        :size="btnSize"
        color="primary"
        title="Remettre en initialisé"
        :loading="saving"
        @click="emit('initialise', item)"
      >
        <v-icon :size="iconSize">mdi-package-variant</v-icon>
      </v-btn>
      <v-btn
        v-if="item.status === 'PERDU'"
        icon
        variant="text"
        :size="btnSize"
        color="primary"
        title="Remettre en initialisé (puce retrouvée)"
        :loading="saving"
        @click="emit('initialise', item)"
      >
        <v-icon :size="iconSize">mdi-package-variant</v-icon>
      </v-btn>
    </template>
    <v-btn
      icon
      variant="text"
      :size="btnSize"
      color="primary"
      title="Historique des opérations sur cette puce"
      @click="emit('history', item)"
    >
      <v-icon :size="iconSize">mdi-history</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'

const props = defineProps({
  item: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

defineEmits(['link', 'unlink', 'give', 'unassign', 'defective', 'lost', 'initialise', 'history'])

const {
  canOperateTransponders,
  canLinkTransponderToTeam,
  canUnlinkTransponderFromTeam,
  canRestockTransponder,
} = usePermissions()

const btnSize = computed(() => (props.compact ? 'x-small' : 'small'))
const iconSize = computed(() => (props.compact ? 16 : 18))
</script>

<style scoped>
.transponder-row-actions {
  max-width: 100%;
}

.transponder-row-actions .v-btn {
  flex-shrink: 0;
}
</style>
