<template>
  <ComptesView />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

useHead({ title: 'Comptes' })
</script>
