<script setup lang="ts">
// Layout de autenticación (login/register)
import { ChartPieIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content flex flex-col">
    <!-- Header simple -->
    <header class="h-14 border-b border-base-300 bg-base-200/80 backdrop-blur flex items-center px-4 gap-4">
      <NuxtLink to="/" class="flex items-center gap-2">
        <ChartPieIcon class="w-6 h-6 text-primary" />
        <span class="font-semibold text-sm">Trading Swing</span>
      </NuxtLink>
    </header>

    <!-- Main content -->
    <main class="flex-1 flex items-center justify-center p-4">
      <slot />
    </main>
  </div>
</template>
