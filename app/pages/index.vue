<script setup lang="ts">
// Dashboard (migrado de views/dashboard/DashboardView.vue)
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { Account } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const { TradingAPI, ScreenerAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const account = ref<Account | null>(null)

const ordersListRef = ref<{ loadOrders: () => void } | null>(null)

const syncingSymbols = ref(false)
const syncMessage = ref<string | null>(null)
const syncError = ref<string | null>(null)

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

const handleOrderCreated = () => {
  if (ordersListRef.value && typeof ordersListRef.value.loadOrders === 'function') {
    ordersListRef.value.loadOrders()
  }
}

const syncMarketSymbols = async () => {
  syncingSymbols.value = true
  syncMessage.value = null
  syncError.value = null
  try {
    const resp = await ScreenerAPI.syncSymbols({ topMostActives: 50, topMovers: 50, market: 'stocks' })
    if (!resp.success) {
      syncError.value = resp.error ?? 'Error al sincronizar símbolos de mercado'
      return
    }
    const count = resp.data?.processed ?? 0
    syncMessage.value = `Se sincronizaron ${count} símbolos de mercado.`
  } catch (e: unknown) {
    syncError.value = (e as Error)?.message ?? 'Error inesperado al sincronizar símbolos de mercado'
  } finally {
    syncingSymbols.value = false
  }
}

const loadAccount = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await TradingAPI.getAccount()
    if (response.success) {
      account.value = response.data
    } else {
      error.value = response.error ?? 'Error al obtener cuenta'
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al obtener cuenta'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAccount()
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Dashboard</h1>
        <p class="text-xs text-base-content/70">Resumen de cuenta, posiciones y órdenes.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="syncingSymbols"
          @click="syncMarketSymbols"
        >
          <span v-if="syncingSymbols" class="loading loading-spinner loading-xs mr-1" />
          <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
          Sincronizar símbolos
        </button>
        <OrderForm @order-created="handleOrderCreated" />
      </div>
    </header>

    <div v-if="syncMessage || syncError" class="mb-2">
      <div v-if="syncMessage" class="alert alert-success py-1 text-xs mb-1">
        <span>{{ syncMessage }}</span>
      </div>
      <div v-if="syncError" class="alert alert-error py-1 text-xs">
        <span>{{ syncError }}</span>
      </div>
    </div>

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

    <div v-else-if="account" class="card bg-base-300 shadow-md">
      <div class="card-body space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="card-title text-base">Información de Cuenta</h2>
          <span
            class="badge badge-sm"
            :class="account.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'"
          >
            {{ account.status }}
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <span class="text-base-content/60 text-xs">ID Cuenta</span>
            <p class="font-semibold text-xs truncate">{{ account.account_id }}</p>
          </div>
          <div>
            <span class="text-base-content/60 text-xs">Moneda</span>
            <p class="font-semibold">{{ account.currency }}</p>
          </div>
          <div>
            <span class="text-base-content/60 text-xs">Capital (Equity)</span>
            <p class="font-semibold">{{ formatCurrency(account.equity) }}</p>
          </div>
          <div>
            <span class="text-base-content/60 text-xs">Poder de Compra</span>
            <p class="font-semibold">{{ formatCurrency(account.buying_power) }}</p>
          </div>
          <div>
            <span class="text-base-content/60 text-xs">Efectivo</span>
            <p class="font-semibold">{{ formatCurrency(account.cash) }}</p>
          </div>
          <div>
            <span class="text-base-content/60 text-xs">Valor Portafolio</span>
            <p class="font-semibold">{{ formatCurrency(account.portfolio_value) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card bg-base-300 shadow-md">
      <div class="card-body">
        <p>No hay datos de cuenta disponibles.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <PositionsList />
      <OrdersList ref="ordersListRef" />
    </div>
  </section>
</template>
