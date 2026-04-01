<template>
  <div class="notif-menu-items">
    <div
      v-for="n in items"
      :key="n.id"
      class="notif-menu-items__row"
      :class="rowClass"
    >
      <p v-if="n.sender" class="notif-menu-items__from text-caption mb-1">
        De : {{ n.sender.firstName }} {{ n.sender.lastName }}
      </p>
      <p class="notif-menu-items__msg mb-1">{{ n.message }}</p>
      <p class="notif-menu-items__date text-caption mb-2">{{ formatDate(n.date) }}</p>
      <div class="d-flex flex-wrap gap-1">
        <v-chip v-if="n.state === 'SEEN'" size="x-small" variant="tonal" color="success">Vue</v-chip>
        <v-chip v-else size="x-small" variant="tonal" color="grey">Non vue</v-chip>
        <v-chip v-if="n.processed" size="x-small" variant="tonal" color="primary">Traitée</v-chip>
        <v-spacer />
        <v-btn
          v-if="n.state === 'UNSEEN'"
          size="x-small"
          variant="text"
          density="compact"
          @click="emit('seen', n.id)"
        >
          Marquer vue
        </v-btn>
        <v-btn
          v-if="!n.processed"
          size="x-small"
          variant="text"
          density="compact"
          @click="emit('processed', n.id)"
        >
          Marquer traitée
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ApiNotification } from '~/types/api'

const props = withDefaults(
  defineProps<{
    items: ApiNotification[]
    emphasis?: 'muted' | 'warning' | 'error'
    isDark?: boolean
  }>(),
  { emphasis: 'muted', isDark: false },
)

const emit = defineEmits(['seen', 'processed'])

const rowClass = computed(() => {
  const e = props.emphasis
  if (props.isDark) {
    return {
      'notif-menu-items__row--dark-muted': e === 'muted',
      'notif-menu-items__row--dark-warning': e === 'warning',
      'notif-menu-items__row--dark-error': e === 'error',
    }
  }
  return {
    'notif-menu-items__row--muted': e === 'muted',
    'notif-menu-items__row--warning': e === 'warning',
    'notif-menu-items__row--error': e === 'error',
  }
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.notif-menu-items__row {
  padding: 10px 10px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.notif-menu-items__row--muted {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.78);
  border-color: rgba(0, 0, 0, 0.1);
}

.notif-menu-items__row--warning {
  background: rgba(255, 152, 0, 0.08);
  border-color: rgba(255, 152, 0, 0.35);
}

.notif-menu-items__row--error {
  background: rgba(244, 67, 54, 0.06);
  border-color: rgba(244, 67, 54, 0.3);
}

/* Mode sombre : contraste lisible (menu souvent en overlay hors du main). */
.notif-menu-items__row--dark-muted {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.22);
}

.notif-menu-items__row--dark-warning {
  background: rgba(255, 183, 77, 0.14);
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 183, 77, 0.45);
}

.notif-menu-items__row--dark-error {
  background: rgba(239, 83, 80, 0.16);
  color: rgba(255, 255, 255, 0.96);
  border-color: rgba(239, 83, 80, 0.45);
}

.notif-menu-items__from {
  font-weight: 600;
  opacity: 0.95;
}

.notif-menu-items__msg {
  font-size: 0.8125rem;
  line-height: 1.4;
}

.notif-menu-items__date {
  opacity: 0.85;
}
</style>
