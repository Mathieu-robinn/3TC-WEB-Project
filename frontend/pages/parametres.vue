<template>
  <ParametresView />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Paramètres' })
</script>
