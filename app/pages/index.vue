<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

if (import.meta.client) {
  await navigateTo('/dashboard')
}
</script>

<template>
  <div />
</template>
