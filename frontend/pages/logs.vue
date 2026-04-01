<template>
  <LogsView />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Logs' })
</script>
