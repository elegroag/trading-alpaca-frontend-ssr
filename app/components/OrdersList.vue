<script setup lang="ts">
// Componente de lista de órdenes (migrado de components/OrdersList.vue)
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { Order } from '~/composables/useApi'

const { TradingAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const orders = ref<Order[]>([])
const cancellingId = ref<string | null>(null)

const loadOrders = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await TradingAPI.getOrders()
    if (response.success) {
      orders.value = response.data
    } else {
      error.value = response.error ?? 'Error al obtener órdenes'
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al obtener órdenes'
  } finally {
    loading.value = false
  }
}

const cancelOrder = async (order: Order) => {
  if (cancellingId.value) return

  if (!import.meta.client) return
  const confirmed = window.confirm('¿Estás seguro de cancelar esta orden?')
  if (!confirmed) return

  error.value = null
  cancellingId.value = order.order_id
  try {
    const response = await TradingAPI.cancelOrder(order.order_id)
    if (!response.success) {
      throw new Error(response.error ?? 'Error al cancelar orden')
    }
    await loadOrders()
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al cancelar la orden'
  } finally {
    cancellingId.value = null
  }
}

onMounted(() => {
  loadOrders()
})

defineExpose({ loadOrders })
</script>

<template>
  <section class="card bg-base-300 shadow-md">
    <div class="card-body p-4 gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title text-base">Órdenes abiertas</h2>
      </div>

      <div v-if="loading" class="flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>

      <div v-else-if="error" class="alert alert-error py-2 text-sm">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="orders.length === 0" class="text-sm text-base-content/70">
        No hay órdenes abiertas.
      </div>

      <div v-else class="mt-2 space-y-2">
        <article
          v-for="order in orders"
          :key="order.order_id"
          class="card bg-base-200 border border-base-300 shadow-sm"
        >
          <div class="card-body p-3 gap-2">
            <header class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-info">{{ order.symbol }}</h3>
                <span
                  class="badge badge-sm"
                  :class="order.side === 'buy' ? 'badge-success' : 'badge-error'"
                >
                  {{ order.side === 'buy' ? 'Compra' : 'Venta' }}
                </span>
                <span class="badge badge-sm badge-warning badge-outline">
                  {{ order.status }}
                </span>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-outline btn-error"
                :disabled="cancellingId === order.order_id"
                @click="cancelOrder(order)"
              >
                <span
                  v-if="cancellingId === order.order_id"
                  class="loading loading-spinner loading-xs mr-1"
                />
                <XMarkIcon v-else class="w-4 h-4 mr-1" />
                Cancelar
              </button>
            </header>

            <div class="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <div class="label-text-alt">Cantidad</div>
                <div class="font-semibold">{{ order.qty }}</div>
              </div>
              <div>
                <div class="label-text-alt">Tipo</div>
                <div class="font-semibold">{{ order.order_type }}</div>
              </div>
              <div v-if="order.limit_price !== null">
                <div class="label-text-alt">Precio límite</div>
                <div class="font-semibold">
                  ${{ order.limit_price.toFixed(2) }}
                </div>
              </div>
              <div v-if="order.time_in_force">
                <div class="label-text-alt">Time in force</div>
                <div class="font-semibold uppercase">
                  {{ order.time_in_force }}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
