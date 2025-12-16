<script setup lang="ts">
// Página de gráfico de precios (migrada de views/price-chart/PriceChart.vue)
import type { Bar } from '~/composables/useApi'
import type { PriceChartOpportunity } from '~/components/chart/PriceChartOpportunitiesDrawer.vue'

definePageMeta({
  middleware: 'auth',
})

type DrawingMode = 'none' | 'support' | 'resistance' | 'trend'

interface PositionData {
  symbol: string
  qty: number
  avg_entry_price: number
  current_price: number
  market_value: number
  unrealized_pl: number
  unrealized_plpc: number
  side: string
}

const route = useRoute()
const { TradingAPI } = useApi()
const wsClient = useSocket()

const symbol = ref((route.query.symbol as string)?.toUpperCase() || 'AAPL')
const timeframe = ref('1D')
const loading = ref(false)
const error = ref<string | null>(null)

const bars = ref<Bar[]>([])
const currentSymbol = ref<string | null>(null)
const currentPrice = ref<number | null>(null)
const closePrice = ref<number | null>(null)
const companyName = ref<string | null>(null)
const wsConnected = ref(false)
const currentPosition = ref<PositionData | null>(null)

const isFullscreen = ref(false)
const drawingMode = ref<DrawingMode>('none')
const opportunities = ref<PriceChartOpportunity[]>([])

const timeframes = [
  { value: '1D', label: '1 Día' },
  { value: '1H', label: '1 Hora' },
  { value: '15Min', label: '15 Min' },
  { value: '5Min', label: '5 Min' },
  { value: '1Min', label: '1 Min' },
]

const xTickOptions = [
  { value: 6, label: 'Pocas' },
  { value: 10, label: 'Medias' },
  { value: 16, label: 'Muchas' },
  { value: 20, label: 'Máximo' },
]
const xTicksLimit = ref(10)

const rangeSteps = [10, 20, 30, 40, 50, 100]
const rangeIndex = ref(0)

const currentMultiplier = computed(() => {
  const idx = rangeIndex.value
  if (idx < 0 || idx >= rangeSteps.length) return rangeSteps[0]!
  return rangeSteps[idx]!
})

const currentLimit = computed(() => currentMultiplier.value * 10)

// Trade modal
const tradeModalRef = ref<HTMLDialogElement | null>(null)
const tradeSymbol = ref('')
const tradePrice = ref<number | null>(null)
const tradeTimestamp = ref<string | null>(null)
const tradeQty = ref(1)
const tradeSide = ref<'buy' | 'sell'>('buy')
const tradeOrderType = ref<'market' | 'limit'>('limit')
const tradeSubmitting = ref(false)
const tradeError = ref<string | null>(null)

// Toast
const toastMessage = ref<string | null>(null)
const toastType = ref<'info' | 'success' | 'error'>('info')
let toastTimeout: ReturnType<typeof setTimeout> | null = null

const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  toastMessage.value = message
  toastType.value = type
  if (toastTimeout !== null) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = null
    toastTimeout = null
  }, 4000)
}

const setDrawingMode = (mode: DrawingMode) => {
  drawingMode.value = drawingMode.value === mode ? 'none' : mode
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const openTradeModalForBar = (index: number) => {
  const sortedBars = [...bars.value].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const bar = sortedBars[index]
  if (!bar) return

  tradeSymbol.value = symbol.value.trim().toUpperCase()
  tradePrice.value = bar.close
  tradeTimestamp.value = bar.timestamp
  tradeQty.value = 1
  tradeSide.value = 'buy'
  tradeOrderType.value = 'limit'
  tradeError.value = null

  if (tradeModalRef.value) {
    tradeModalRef.value.showModal()
  }
}

const closeTradeModal = () => {
  if (tradeModalRef.value) {
    tradeModalRef.value.close()
  }
}

const submitTradeFromChart = async () => {
  tradeError.value = null

  const symbolValue = tradeSymbol.value.trim().toUpperCase()
  if (!symbolValue) {
    tradeError.value = 'El símbolo es obligatorio.'
    return
  }

  if (!tradeQty.value || tradeQty.value <= 0) {
    tradeError.value = 'La cantidad debe ser mayor a 0.'
    return
  }

  if (tradeOrderType.value === 'limit' && (!tradePrice.value || tradePrice.value <= 0)) {
    tradeError.value = 'El precio límite debe ser mayor a 0.'
    return
  }

  const payload: Record<string, unknown> = {
    symbol: symbolValue,
    qty: tradeQty.value,
    side: tradeSide.value,
    order_type: tradeOrderType.value,
  }

  if (tradeOrderType.value === 'limit' && tradePrice.value) {
    payload.limit_price = tradePrice.value
  }

  tradeSubmitting.value = true
  try {
    const response = await TradingAPI.createOrder(payload as any)
    if (!response.success) {
      throw new Error(response.error ?? 'Error al crear orden')
    }
    closeTradeModal()
    showToast('Orden creada correctamente.', 'success')
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? 'Error inesperado al crear la orden'
    tradeError.value = msg
    showToast(msg, 'error')
  } finally {
    tradeSubmitting.value = false
  }
}

const applyQuoteData = (data: Record<string, unknown>) => {
  companyName.value = (data?.name as string) ?? null
  currentPrice.value = typeof data?.price === 'number' ? data.price : null
  closePrice.value = typeof data?.close === 'number' ? data.close : null
}

const loadChart = async () => {
  if (loading.value) return

  const sym = symbol.value.trim().toUpperCase()
  if (!sym) {
    error.value = 'Ingresa un símbolo válido.'
    return
  }

  loading.value = true
  error.value = null
  try {
    const res = await TradingAPI.getChartData(sym, timeframe.value, currentLimit.value)
    if (!res.success) {
      throw new Error(res.error ?? 'Error al obtener datos del gráfico')
    }

    const chartData = res.data as unknown as Record<string, unknown>
    if (!chartData || !chartData.bars || (chartData.bars as Bar[]).length === 0) {
      bars.value = []
      error.value = `No hay datos disponibles para ${sym}.`
      return
    }

    bars.value = chartData.bars as Bar[]
    if (chartData.quote) {
      applyQuoteData(chartData.quote as Record<string, unknown>)
    }

    currentSymbol.value = sym
    wsClient.subscribeToSymbol(sym)
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al cargar el gráfico'
  } finally {
    loading.value = false
  }
}

const handleQuoteUpdate = (data: unknown) => {
  const payload = data as { symbol?: string; price?: number }
  if (
    payload?.symbol?.toUpperCase() === currentSymbol.value &&
    typeof payload.price === 'number'
  ) {
    currentPrice.value = payload.price
  }
}

const handlePositionUpdate = (data: unknown) => {
  const payload = data as PositionData
  if (!payload || !payload.symbol) return
  if (payload.symbol.toUpperCase() === currentSymbol.value) {
    currentPosition.value = payload
  }
}

onMounted(() => {
  wsClient.subscribe('connected', () => { wsConnected.value = true })
  wsClient.subscribe('disconnected', () => { wsConnected.value = false })
  wsClient.subscribe('quote_update', handleQuoteUpdate)
  wsClient.subscribe('position_update', handlePositionUpdate)
  loadChart()
})

onUnmounted(() => {
  if (currentSymbol.value) {
    wsClient.unsubscribeFromSymbol(currentSymbol.value)
  }
  currentSymbol.value = null
  currentPosition.value = null
})

watch(() => route.query.symbol, (newVal) => {
  const sym = (newVal as string)?.trim()?.toUpperCase()
  if (sym && sym !== symbol.value.toUpperCase()) {
    symbol.value = sym
    loadChart()
  }
})

watch(timeframe, loadChart)
watch(rangeIndex, loadChart)
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg sm:text-xl font-semibold">
          {{ symbol.toUpperCase() }}
          <span v-if="currentPrice != null" class="ml-1 text-sm sm:text-base font-normal text-base-content/80">
            · ${{ currentPrice.toFixed(2) }}
          </span>
          <span v-if="closePrice != null" class="ml-1 text-xs sm:text-sm font-normal text-base-content/70">
            (Cierre: ${{ closePrice.toFixed(2) }})
          </span>
        </h1>
        <p class="text-xs sm:text-sm text-base-content/70">
          <span v-if="companyName">{{ companyName }}</span>
          <span v-else>Visualiza el historial de precios de un símbolo usando datos de Alpaca.</span>
        </p>
        <div class="mt-1 flex items-center gap-2 text-[0.65rem] sm:text-xs text-base-content/60">
          <span>Tiempo real:</span>
          <span class="badge badge-xs" :class="wsConnected ? 'badge-success' : 'badge-error'">
            {{ wsConnected ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>

        <div v-if="currentPosition" class="mt-2 p-2 bg-base-200 rounded-lg text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold">Posición:</span>
            <span :class="currentPosition.side === 'long' ? 'text-success' : 'text-error'">
              {{ currentPosition.qty }} @ ${{ currentPosition.avg_entry_price.toFixed(2) }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span>P/L:</span>
            <span :class="currentPosition.unrealized_pl >= 0 ? 'text-success' : 'text-error'">
              ${{ currentPosition.unrealized_pl.toFixed(2) }} ({{ currentPosition.unrealized_plpc.toFixed(2) }}%)
            </span>
          </div>
        </div>
      </div>

      <ClientOnly>
        <LazyChartPriceChartToolbar
          v-model:symbol="symbol"
          v-model:timeframe="timeframe"
          v-model:xTicksLimit="xTicksLimit"
          v-model:rangeIndex="rangeIndex"
          :timeframes="timeframes"
          :xTickOptions="xTickOptions"
          :rangeSteps="rangeSteps"
          :loading="loading"
          :isFullscreen="isFullscreen"
          :drawingMode="drawingMode"
          @submit="loadChart"
          @reset-zoom="() => {}"
          @toggle-fullscreen="toggleFullscreen"
          @set-drawing-mode="setDrawingMode"
          @clear-annotations="() => {}"
        />
      </ClientOnly>
    </header>

    <div v-if="error" class="alert alert-error py-2 text-sm">
      <span>{{ error }}</span>
    </div>

    <div
      class="card bg-base-300 shadow-md"
      :class="isFullscreen ? 'fixed inset-0 z-50 rounded-none border border-base-200' : ''"
    >
      <div class="card-body space-y-3" :class="isFullscreen ? 'h-full p-2 sm:p-4' : ''">
        <div class="flex flex-col lg:flex-row gap-4 h-full">
          <div
            class="relative flex-1 min-h-[280px] sm:min-h-[320px]"
            :class="isFullscreen ? 'h-[85vh]' : 'h-[55vh] sm:h-[60vh] lg:h-[65vh]'"
          >
            <button
              v-if="isFullscreen"
              type="button"
              class="btn btn-circle btn-xs absolute right-2 top-2 z-50"
              @click="toggleFullscreen"
            >
              ✕
            </button>

            <ClientOnly>
              <LazyPriceChartCanvas
                :bars="bars"
                :symbol="symbol"
                :timeframe="timeframe"
                @bar-click="openTradeModalForBar"
              />
              <template #fallback>
                <div class="flex justify-center py-8">
                  <span class="loading loading-spinner loading-lg" />
                </div>
              </template>
            </ClientOnly>

            <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-base-300/60">
              <span class="loading loading-spinner loading-lg" />
            </div>
          </div>

          <ClientOnly>
            <LazyChartPriceChartOpportunitiesDrawer
              :opportunities="opportunities"
              :isFullscreen="isFullscreen"
              :timeframe="timeframe"
              :currentMultiplier="currentMultiplier"
              :currentLimit="currentLimit"
              @select-opportunity="openTradeModalForBar"
            />
          </ClientOnly>
        </div>
      </div>
    </div>

    <dialog ref="tradeModalRef" class="modal">
      <ClientOnly>
        <LazyChartPriceChartTradeModal
          v-model:tradeSymbol="tradeSymbol"
          v-model:tradePrice="tradePrice"
          v-model:tradeQty="tradeQty"
          v-model:tradeSide="tradeSide"
          v-model:tradeOrderType="tradeOrderType"
          :tradeSubmitting="tradeSubmitting"
          :tradeError="tradeError"
          :tradeTimestamp="tradeTimestamp"
          @submit="submitTradeFromChart"
          @close="closeTradeModal"
        />
      </ClientOnly>
    </dialog>

    <div v-if="toastMessage" class="toast toast-end">
      <div
        class="alert"
        :class="{
          'alert-info': toastType === 'info',
          'alert-success': toastType === 'success',
          'alert-error': toastType === 'error',
        }"
      >
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </section>
</template>
