<script setup lang="ts">
// Página de gráfico de precios (migrada de views/price-chart/PriceChart.vue)
import { useChart } from './useChart'
import { timeframes, xTickOptions, rangeSteps } from './chart.utils'

definePageMeta({
  middleware: 'auth',
})

const {
  symbol,
  timeframe,
  loading,
  error,
  bars,
  currentPrice,
  closePrice,
  companyName,
  wsConnected,
  currentPosition,
  isFullscreen,
  drawingMode,
  opportunities,
  valuationRulesEnabled,
  valuationBaseSma,
  effectiveOverPct,
  effectiveUnderPct,
  xTicksLimit,
  rangeIndex,
  currentMultiplier,
  currentLimit,
  tradeModalRef,
  tradeSymbol,
  tradePrice,
  tradeTimestamp,
  tradeQty,
  tradeSide,
  tradeOrderType,
  tradeSubmitting,
  tradeError,
  toastMessage,
  toastType,
  setDrawingMode,
  toggleFullscreen,
  openTradeModalForBar,
  closeTradeModal,
  submitTradeFromChart,
  loadChart,
} = useChart()

const priceChartCanvasRef = ref<{ resetZoom?: () => void; clearAnnotations?: () => void } | null>(null)

const resetZoom = () => {
  priceChartCanvasRef.value?.resetZoom?.()
}

const clearAnnotations = () => {
  priceChartCanvasRef.value?.clearAnnotations?.()
}

const handleOpportunities = (
  value: { index: number; timestamp: string; price: number; type: 'overvalued' | 'undervalued' }[],
) => {
  opportunities.value = value
}
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
          @reset-zoom="resetZoom"
          @toggle-fullscreen="toggleFullscreen"
          @set-drawing-mode="setDrawingMode"
          @clear-annotations="clearAnnotations"
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

            <div v-if="isFullscreen" class="absolute left-2 top-2 z-50 flex flex-row gap-1">
              <button
                type="button"
                class="btn btn-xs"
                :class="drawingMode === 'support' ? 'btn-primary' : 'btn-ghost'"
                @click="setDrawingMode('support')"
              >
                S
              </button>
              <button
                type="button"
                class="btn btn-xs"
                :class="drawingMode === 'resistance' ? 'btn-primary' : 'btn-ghost'"
                @click="setDrawingMode('resistance')"
              >
                R
              </button>
              <button
                type="button"
                class="btn btn-xs"
                :class="drawingMode === 'trend' ? 'btn-primary' : 'btn-ghost'"
                @click="setDrawingMode('trend')"
              >
                TL
              </button>
              <button type="button" class="btn btn-xs btn-ghost" @click="clearAnnotations">X</button>
            </div>

            <ClientOnly>
              <LazyPriceChartCanvas
                ref="priceChartCanvasRef"
                :bars="bars"
                :symbol="symbol"
                :timeframe="timeframe"
                :xTicksLimit="xTicksLimit"
                :drawingMode="drawingMode"
                :valuationRulesEnabled="valuationRulesEnabled"
                :valuationBaseSma="valuationBaseSma"
                :effectiveOverPct="effectiveOverPct"
                :effectiveUnderPct="effectiveUnderPct"
                :realtimePrice="currentPrice"
                @bar-click="openTradeModalForBar"
                @opportunities="handleOpportunities"
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
