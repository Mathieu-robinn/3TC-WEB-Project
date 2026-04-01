<template>
  <Teleport to="body">
    <div class="notification-toast-stack" aria-live="polite">
      <TransitionGroup name="toast-slide">
        <div
          v-for="t in notifStore.adminToasts"
          :key="t.key"
          class="notification-toast-stack__item"
          :class="{
            'notification-toast-stack__item--emergency': t.type === 'EMERGENCY',
            'notification-toast-stack__item--alert': t.type === 'ALERT',
          }"
          role="status"
        >
          <button
            type="button"
            class="notification-toast-stack__close"
            aria-label="Fermer"
            @click="notifStore.dismissToast(t.key)"
          >
            <v-icon size="32">mdi-close</v-icon>
          </button>
          <p v-if="t.authorLabel" class="notification-toast-stack__author mb-1">
            {{ t.authorLabel }}
          </p>
          <p
            class="notification-toast-stack__text mb-0"
            :class="{ 'font-weight-bold': t.type === 'EMERGENCY' }"
          >
            {{ t.message }}
          </p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications.store'

const notifStore = useNotificationsStore()
</script>

<style scoped>
.notification-toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: min(800px, calc(100vw - 32px));
  pointer-events: none;
}

.notification-toast-stack__item {
  pointer-events: auto;
  position: relative;
  padding: 22px 52px 22px 22px;
  border-radius: 14px;
  box-shadow:
    0 6px 22px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  color: #fff;
}

.notification-toast-stack__item--alert {
  background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);
}

.notification-toast-stack__item--emergency {
  background: linear-gradient(135deg, #b71c1c 0%, #e53935 100%);
}

.notification-toast-stack__close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  border-radius: 8px;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-toast-stack__close:hover {
  background: rgba(255, 255, 255, 0.35);
}

.notification-toast-stack__author {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  opacity: 0.95;
  letter-spacing: 0.02em;
}

.notification-toast-stack__text {
  font-size: 1.15rem;
  line-height: 1.45;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
