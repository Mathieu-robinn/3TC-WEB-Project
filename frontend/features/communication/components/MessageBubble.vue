<template>
  <div
    class="message-bubble-wrapper d-flex"
    :class="[isMine ? 'justify-end' : 'justify-start', isGroupedWithNext ? 'mb-1' : 'mb-4']"
  >
    <!-- Avatar for OTHER users – hide if the next msg is also from them (meta shown on last) -->
    <v-avatar
      v-if="!isMine"
      size="36"
      :color="isGroupedWithNext ? 'transparent' : 'indigo-lighten-2'"
      class="mr-2 align-self-end flex-shrink-0"
      :class="isGroupedWithNext ? 'elevation-0' : 'elevation-1'"
    >
      <span v-if="!isGroupedWithNext" class="text-caption font-weight-bold text-white">{{ initials }}</span>
    </v-avatar>

    <div class="message-content d-flex flex-column" :class="{ 'align-end': isMine, 'align-start': !isMine }">
      <!-- Date separator: show when day changes from previous message -->
      <div v-if="showDateSeparator" class="date-separator text-caption text-medium-emphasis mb-3 align-self-center">
        {{ dateLabel }}
      </div>

      <!-- Bubble: clickable to toggle meta when it's a grouped middle/first bubble -->
      <v-sheet
        class="pa-3 message-bubble elevation-2"
        :class="[isMine ? 'mine' : 'theirs', isGroupedWithPrev ? (isMine ? 'grouped-mine' : 'grouped-theirs') : '']"
        rounded="xl"
        @click="isGroupedWithNext && !isLastInGroup && (showMeta = !showMeta)"
        :style="isGroupedWithNext && !isLastInGroup ? 'cursor: pointer' : ''"
      >
        <span class="text-body-2" style="line-height: 1.5;">{{ message.content }}</span>
      </v-sheet>

      <!-- Meta (name + time): always visible on last message of a group, hidden on others -->
      <!-- Clicking a mid-group bubble reveals meta via showMeta toggle -->
      <v-expand-transition>
        <span
          v-if="isLastInGroup || (!isGroupedWithNext && !isGroupedWithPrev) || showMeta"
          class="text-caption text-medium-emphasis mt-1 mx-1 d-flex align-center gap-1"
        >
          <template v-if="message.sender">
            <span class="font-weight-medium">{{ senderLabel }}</span>
            <span class="opacity-60">•</span>
          </template>
          <span>{{ formattedTime }}</span>
        </span>
      </v-expand-transition>
    </div>

    <!-- Avatar for OWN messages (right side) – hide on non-last of a group -->
    <v-avatar
      v-if="isMine"
      size="36"
      :color="isGroupedWithNext ? 'transparent' : 'primary'"
      class="ml-2 align-self-end flex-shrink-0"
      :class="isGroupedWithNext ? 'elevation-0' : 'elevation-1'"
    >
      <span v-if="!isGroupedWithNext" class="text-caption font-weight-bold text-white">{{ initials }}</span>
    </v-avatar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '../types/communication'

const props = defineProps<{
  message: Message;
  currentUserId: number;
  showName?: boolean;
  prevMessage?: Message | null;
  nextMessage?: Message | null;
}>()

const showMeta = ref(false)

const isMine = computed(() => props.message.senderUserId === props.currentUserId)

const initials = computed(() => {
  if (!props.message.sender) return '?'
  const f = props.message.sender.firstName?.charAt(0) || ''
  const l = props.message.sender.lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || '?'
})

const senderLabel = computed(() => {
  if (!props.message.sender) return ''
  const { firstName, lastName } = props.message.sender
  return `${firstName ?? ''} ${(lastName?.charAt(0) ?? '')}.`.trim()
})

const msgDate = computed(() => new Date(props.message.createdAt))

const formattedTime = computed(() => {
  return msgDate.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
})

const dateLabel = computed(() => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const d = msgDate.value
  if (isSameDay(d, today)) return "Aujourd'hui"
  if (isSameDay(d, yesterday)) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function withinFiveMinutes(a: Date, b: Date) {
  return Math.abs(b.getTime() - a.getTime()) < 5 * 60 * 1000
}

// Is this message grouped with its PREVIOUS message (same sender, < 5 min, same day)?
const isGroupedWithPrev = computed(() => {
  if (!props.prevMessage) return false
  if (props.prevMessage.senderUserId !== props.message.senderUserId) return false
  const prevDate = new Date(props.prevMessage.createdAt)
  return withinFiveMinutes(prevDate, msgDate.value) && isSameDay(prevDate, msgDate.value)
})

// Is this message grouped with its NEXT message (same sender, < 5 min, same day)?
const isGroupedWithNext = computed(() => {
  if (!props.nextMessage) return false
  if (props.nextMessage.senderUserId !== props.message.senderUserId) return false
  const nextDate = new Date(props.nextMessage.createdAt)
  return withinFiveMinutes(msgDate.value, nextDate) && isSameDay(msgDate.value, nextDate)
})

// This is the LAST message in a consecutive group (prev is same sender, next is NOT)
const isLastInGroup = computed(() => isGroupedWithPrev.value && !isGroupedWithNext.value)

// Show date separator only when day changes
const showDateSeparator = computed(() => {
  if (!props.prevMessage) return true
  const prevDate = new Date(props.prevMessage.createdAt)
  return !isSameDay(prevDate, msgDate.value)
})
</script>

<style scoped lang="scss">
.message-bubble-wrapper {
  max-width: 100%;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  position: relative;
  word-break: break-word;
  user-select: text;
}

.message-bubble.mine {
  border-bottom-right-radius: 4px !important;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.85) 100%) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.3) !important;
}

.message-bubble.theirs {
  border-bottom-left-radius: 4px !important;
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

// Continuation bubbles in the same group get slightly smaller radius
.message-bubble.grouped-mine {
  border-top-right-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
}
.message-bubble.grouped-theirs {
  border-top-left-radius: 8px !important;
  border-bottom-left-radius: 8px !important;
}

.date-separator {
  background: rgba(var(--v-theme-surface), 0.6);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  font-size: 11px;
  letter-spacing: 0.3px;
}
</style>
