<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useOrders } from './useOrders'

definePageMeta({
  middleware: 'auth',
})

const { ordersListRef, handleOrderCreated, refreshOrders } = useOrders()
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Órdenes abiertas</h1>
        <p class="text-xs text-base-content/70">Gestión y cancelación de órdenes abiertas.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="btn btn-sm btn-outline" @click="refreshOrders">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
        </button>
        <OrderForm @order-created="handleOrderCreated" />
      </div>
    </header>

    <OrdersList ref="ordersListRef" />
  </section>
</template>
