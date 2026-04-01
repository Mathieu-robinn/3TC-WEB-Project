<template>
  <v-app :theme="themeStore.isDark ? 'dark' : 'light'">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/features/theme/stores/theme'

const themeStore = useThemeStore()
</script>
