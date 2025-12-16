<script setup lang="ts">
// Dashboard (migrado de views/dashboard/DashboardView.vue)
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { Account, Position, Order } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const { TradingAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)

const account = ref<Account | null>(null)
const positions = ref<Position[]>([])
const orders = ref<Order[]>([])

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [accountRes, positionsRes, ordersRes] = await Promise.all([
      TradingAPI.getAccount(),
      TradingAPI.getPositions(),
      TradingAPI.getOrders(),
    ])

    if (!accountRes.success) {
      error.value = accountRes.error ?? 'Error al obtener cuenta'
      return
    }

    account.value = accountRes.data
    positions.value = positionsRes.success ? positionsRes.data : []
    orders.value = ordersRes.success ? ordersRes.data : []
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al cargar datos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold">Dashboard</h1>
        <p class="text-xs text-base-content/70">Resumen de cuenta, posiciones y órdenes.</p>
      </div>
      <button type="button" class="btn btn-sm btn-outline" @click="loadData" :disabled="loading">
        <ArrowPathIcon class="w-4 h-4 mr-1" />
        Recargar
      </button>
    </header>

    <div v-if="loading" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>
    </div>

    <div v-else-if="error" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <div class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Cuenta -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body">
          <h2 class="card-title text-base">Cuenta</h2>
          <div v-if="account" class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-base-content/60">Cash</span>
              <p class="font-semibold">${{ account.cash.toFixed(2) }}</p>
            </div>
            <div>
              <span class="text-base-content/60">Buying Power</span>
              <p class="font-semibold">${{ account.buying_power.toFixed(2) }}</p>
            </div>
            <div>
              <span class="text-base-content/60">Portfolio Value</span>
              <p class="font-semibold">${{ account.portfolio_value.toFixed(2) }}</p>
            </div>
            <div>
              <span class="text-base-content/60">Equity</span>
              <p class="font-semibold">${{ account.equity.toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Posiciones -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body p-0 overflow-x-auto">
          <div class="px-4 pt-4 pb-2">
            <h2 class="card-title text-base">Posiciones ({{ positions.length }})</h2>
          </div>
          <table class="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Precio entrada</th>
                <th class="text-right">Precio actual</th>
                <th class="text-right">P/L</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in positions" :key="pos.symbol">
                <td class="font-mono">{{ pos.symbol }}</td>
                <td class="text-right">{{ pos.qty }}</td>
                <td class="text-right">${{ pos.avg_entry_price.toFixed(2) }}</td>
                <td class="text-right">${{ pos.current_price.toFixed(2) }}</td>
                <td
                  class="text-right"
                  :class="pos.unrealized_pl >= 0 ? 'text-success' : 'text-error'"
                >
                  ${{ pos.unrealized_pl.toFixed(2) }} ({{ pos.unrealized_plpc.toFixed(2) }}%)
                </td>
              </tr>
              <tr v-if="!positions.length">
                <td colspan="5" class="text-center py-4 text-sm text-base-content/70">
                  Sin posiciones abiertas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Órdenes -->
      <div class="card bg-base-300 shadow-md">
        <div class="card-body p-0 overflow-x-auto">
          <div class="px-4 pt-4 pb-2">
            <h2 class="card-title text-base">Órdenes recientes ({{ orders.length }})</h2>
          </div>
          <table class="table table-zebra table-sm">
            <thead>
              <tr>
                <th>Símbolo</th>
                <th>Side</th>
                <th>Tipo</th>
                <th class="text-right">Qty</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.order_id">
                <td class="font-mono">{{ order.symbol }}</td>
                <td>{{ order.side }}</td>
                <td>{{ order.order_type }}</td>
                <td class="text-right">{{ order.qty }}</td>
                <td>
                  <span
                    class="badge badge-sm"
                    :class="{
                      'badge-success': order.status === 'filled',
                      'badge-warning': order.status === 'pending_new' || order.status === 'new',
                      'badge-error': order.status === 'canceled' || order.status === 'rejected',
                    }"
                  >
                    {{ order.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="!orders.length">
                <td colspan="5" class="text-center py-4 text-sm text-base-content/70">
                  Sin órdenes recientes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
