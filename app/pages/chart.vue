<script setup lang="ts">
// Página de gráfico de precios (migrada de views/price-chart/PriceChart.vue)
// Versión simplificada - el gráfico completo con Chart.js se renderiza solo en cliente
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import type { Bar, Quote } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { TradingAPI } = useApi()
const wsClient = useSocket()

const symbol = ref((route.query.symbol as string)?.toUpperCase() || 'AAPL')
const timeframe = ref('1D')
const loading = ref(false)
const error = ref<string | null>(null)

const bars = ref<Bar[]>([])
const currentPrice = ref<number | null>(null)
const companyName = ref<string | null>(null)
const wsConnected = ref(false)

const timeframes = [
  { value: '1D', label: '1 Día' },
  { value: '1H', label: '1 Hora' },
  { value: '15Min', label: '15 Min' },
  { value: '5Min', label: '5 Min' },
  { value: '1Min', label: '1 Min' },
]

const loadChart = async () => {
  const sym = symbol.value.trim().toUpperCase()
  if (!sym) {
    error.value = 'Ingresa un símbolo válido.'
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await TradingAPI.getChartData(sym, timeframe.value, 100)
    if (!res.success) {
      throw new Error(res.error ?? 'Error al obtener datos del gráfico')
    }

    const chartData = res.data
    if (!chartData || !chartData.bars || chartData.bars.length === 0) {
      bars.value = []
      error.value = `No hay datos disponibles para ${sym}.`
      return
    }

    bars.value = chartData.bars
    if (chartData.quote) {
      currentPrice.value = chartData.quote.price
      companyName.value = chartData.quote.name ?? null
    }

    // Suscribir al símbolo para actualizaciones en tiempo real
    wsClient.subscribeToSymbol(sym)
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al cargar el gráfico'
  } finally {
    loading.value = false
  }
}

// WebSocket handlers
const handleQuoteUpdate = (data: unknown) => {
  const payload = data as { symbol?: string; price?: number }
  if (payload?.symbol?.toUpperCase() === symbol.value.toUpperCase() && typeof payload.price === 'number') {
    currentPrice.value = payload.price
  }
}

onMounted(() => {
  wsClient.subscribe('connected', () => { wsConnected.value = true })
  wsClient.subscribe('disconnected', () => { wsConnected.value = false })
  wsClient.subscribe('quote_update', handleQuoteUpdate)
  loadChart()
})

onUnmounted(() => {
  if (symbol.value) {
    wsClient.unsubscribeFromSymbol(symbol.value)
  }
})

watch(() => route.query.symbol, (newVal) => {
  const sym = (newVal as string)?.trim()?.toUpperCase()
  if (sym && sym !== symbol.value) {
    symbol.value = sym
    loadChart()
  }
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg sm:text-xl font-semibold">
          {{ symbol }}
          <span v-if="currentPrice != null" class="ml-1 text-sm sm:text-base font-normal text-base-content/80">
            · ${{ currentPrice.toFixed(2) }}
          </span>
        </h1>
        <p class="text-xs sm:text-sm text-base-content/70">
          <span v-if="companyName">{{ companyName }}</span>
          <span v-else>Visualiza el historial de precios de un símbolo.</span>
        </p>
        <div class="mt-1 flex items-center gap-2 text-xs text-base-content/60">
          <span>Tiempo real:</span>
          <span class="badge badge-xs" :class="wsConnected ? 'badge-success' : 'badge-error'">
            {{ wsConnected ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="symbol"
          type="text"
          placeholder="Símbolo"
          class="input input-sm input-bordered w-24"
          @keyup.enter="loadChart"
        />
        <select v-model="timeframe" class="select select-sm select-bordered" @change="loadChart">
          <option v-for="tf in timeframes" :key="tf.value" :value="tf.value">
            {{ tf.label }}
          </option>
        </select>
        <button type="button" class="btn btn-sm btn-primary" @click="loadChart" :disabled="loading">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Cargar
        </button>
      </div>
    </header>

    <div v-if="loading" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>
    </div>

    <div v-else-if="error" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <div class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="bars.length" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <ClientOnly>
          <LazyPriceChartCanvas :bars="bars" :symbol="symbol" :timeframe="timeframe" />
          <template #fallback>
            <div class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <div v-else class="card bg-base-300 shadow-md">
      <div class="card-body text-center text-base-content/70">
        <p>Ingresa un símbolo y presiona "Cargar" para ver el gráfico.</p>
      </div>
    </div>
  </section>
</template>
