<script setup lang="ts">
import type { Bar, Quote } from '~/composables/useApi'
import { useMultiCompare } from './useMultiCompare'
import { formatMultiCompareLabel } from './multiCompare.utils'
import MultiCompareToolbar from './components/MultiCompareToolbar.vue'
import MultiCompareSymbolsPanel from './components/MultiCompareSymbolsPanel.vue'

definePageMeta({
  middleware: 'auth',
})

const { TradingAPI } = useApi()

const { maxSymbols, symbols, newSymbol, loading, error, symbolDetails, enrichedSymbols } = useMultiCompare()

const route = useRoute()

const timeframes = [
  { value: '1D', label: '1 Día' },
  { value: '1H', label: '1 Hora' },
  { value: '1W', label: '1 Semana' },
  { value: '1M', label: '1 Mes' },
]

const timeframe = ref('1D')

const rangeSteps = [10, 20, 30, 40, 50, 100]
const rangeIndex = ref(0)

const xTickOptions = [
  { value: 6, label: 'Pocas' },
  { value: 10, label: 'Medias' },
  { value: 16, label: 'Muchas' },
  { value: 20, label: 'Máximo' },
]
const xTicksLimit = ref<number>(10)

const currentMultiplier = computed<number>(() => {
  const list = rangeSteps
  const idx = rangeIndex.value
  if (idx < 0 || idx >= list.length) return list[0]!
  return list[idx]!
})

const currentLimit = computed(() => currentMultiplier.value * 10)

const combinedCanvasRef = ref<HTMLCanvasElement | null>(null)
let combinedChart: any = null
let ChartCtor: any = null

const ensureChartJs = async () => {
  if (ChartCtor) return

  const chartMod = await import('chart.js/auto')
  const zoomMod = await import('chartjs-plugin-zoom')

  ChartCtor = chartMod.Chart
  if (ChartCtor?.register) {
    ChartCtor.register(zoomMod.default)
  }
}

const addSymbolFromInput = () => {
  const s = newSymbol.value.trim().toUpperCase()
  if (!s) return
  if (symbols.value.includes(s)) {
    newSymbol.value = ''
    return
  }
  if (symbols.value.length >= maxSymbols) return
  symbols.value.push(s)
  newSymbol.value = ''
  loadCharts()
}

const removeSymbol = (symbolToRemove: string) => {
  if (symbols.value.length <= 1) return
  const idx = symbols.value.indexOf(symbolToRemove)
  if (idx !== -1) {
    symbols.value.splice(idx, 1)
    loadCharts()
  }
}

const destroyCombinedChart = () => {
  if (combinedChart) {
    combinedChart.destroy()
    combinedChart = null
  }
}

watch(xTicksLimit, (val) => {
  if (!combinedChart) return
  const scales: any = combinedChart.options?.scales
  if (scales?.x?.ticks) {
    scales.x.ticks.maxTicksLimit = val
    combinedChart.update()
  }
})

const buildCombinedChart = async (series: { symbol: string; bars: Bar[] }[]) => {
  const canvas = combinedCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  await ensureChartJs()

  destroyCombinedChart()

  if (!series.length || !ChartCtor) {
    return
  }

  const sortedSeries = series.map((s) => ({
    symbol: s.symbol,
    bars: [...s.bars].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  }))

  const base = sortedSeries[0]!
  const baseTimestamps = base.bars.map((b) => b.timestamp)
  const labels = base.bars.map((b) => formatMultiCompareLabel(b.timestamp, timeframe.value))

  const palette = [
    'rgb(59,130,246)',
    'rgb(34,197,94)',
    'rgb(249,115,22)',
    'rgb(244,63,94)',
    'rgb(234,179,8)',
    'rgb(168,85,247)',
  ]

  const datasets = sortedSeries.map((s, idx) => {
    const color = palette[idx % palette.length]
    const barMap = new Map<string, number>()
    for (const b of s.bars) {
      barMap.set(b.timestamp, b.close)
    }

    const data = baseTimestamps.map((ts) => {
      const v = barMap.get(ts)
      return typeof v === 'number' ? v : null
    })

    return {
      label: s.symbol.toUpperCase(),
      data,
      borderColor: color,
      backgroundColor: 'transparent',
      borderWidth: 2,
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 3,
      fill: false,
    }
  })

  let yMin = Number.POSITIVE_INFINITY
  let yMax = Number.NEGATIVE_INFINITY

  for (const ds of datasets) {
    const data = ds.data as Array<number | null>
    for (const v of data) {
      if (typeof v === 'number') {
        if (v < yMin) yMin = v
        if (v > yMax) yMax = v
      }
    }
  }

  let finalMin: number | undefined
  let finalMax: number | undefined
  let stepSize: number | undefined

  if (Number.isFinite(yMin) && Number.isFinite(yMax) && yMax > yMin) {
    const padding = (yMax - yMin) * 0.1
    finalMin = yMin - padding
    finalMax = yMax + padding
    const range = finalMax - finalMin
    if (range > 0) {
      stepSize = range / 10
    }
  }

  const config: any = {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#e5e7eb',
          },
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148,163,184,0.2)',
          },
          ticks: {
            color: '#e5e7eb',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: xTicksLimit.value,
          },
        },
        y: {
          grid: {
            color: 'rgba(148,163,184,0.2)',
          },
          ticks: {
            color: '#e5e7eb',
            maxTicksLimit: 12,
            stepSize,
            callback(value: any) {
              return `$${Number(value).toFixed(2)}`
            },
          },
          min: finalMin,
          max: finalMax,
        },
      },
    },
  }

  combinedChart = new ChartCtor(ctx, config)
}

const loadCharts = async () => {
  if (!import.meta.client) return
  if (loading.value) return

  loading.value = true
  error.value = null

  try {
    const tf = timeframe.value
    const limit = currentLimit.value
    const series: { symbol: string; bars: Bar[] }[] = []
    symbolDetails.value = {}

    await Promise.all(
      symbols.value.map(async (sym) => {
        const s = sym.trim().toUpperCase()
        if (!s) return

        try {
          const res = await TradingAPI.getBars(s, tf, limit)
          if (!res.success || !res.data || res.data.length === 0) {
            return
          }

          series.push({ symbol: s, bars: res.data })

          const sortedBars = [...res.data].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )

          const first = sortedBars[0]
          const last = sortedBars[sortedBars.length - 1]

          let perfPct: number | null = null
          let price: number | null = null
          let volume: number | null = null
          let name: string | null = null

          if (first && last && first.close > 0) {
            perfPct = ((last.close - first.close) / first.close) * 100
          }

          if (last) {
            price = last.close
            volume = last.volume
          }

          try {
            const quoteRes = await TradingAPI.getQuote(s)
            if (quoteRes.success && quoteRes.data) {
              const q = quoteRes.data as Quote
              if (q.name != null) {
                name = q.name
              }
              if (typeof q.price === 'number') {
                price = q.price
              }
            }
          } catch {
            // ignore
          }

          symbolDetails.value[s] = {
            name,
            price,
            volume,
            perfPct,
          }
        } catch {
          // ignore
        }
      }),
    )

    if (series.length) {
      await buildCombinedChart(series)
    } else {
      destroyCombinedChart()
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Error inesperado al cargar los gráficos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const initialSymbol = (route.query.symbol as string | undefined)?.trim()
  if (initialSymbol) {
    symbols.value = [initialSymbol.toUpperCase()]
    loadCharts()
  }
})

onUnmounted(() => {
  destroyCombinedChart()
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-lg sm:text-xl font-semibold">Comparación de símbolos</h1>
        <p class="text-xs sm:text-sm text-base-content/70">
          Selecciona hasta 6 símbolos para comparar sus gráficos de precios en paralelo.
        </p>
      </div>

      <MultiCompareToolbar
        v-model:timeframe="timeframe"
        v-model:xTicksLimit="xTicksLimit"
        v-model:rangeIndex="rangeIndex"
        :timeframes="timeframes"
        :xTickOptions="xTickOptions"
        :rangeSteps="rangeSteps"
        :loading="loading"
        @submit="loadCharts"
      />
    </header>

    <div v-if="error" class="alert alert-error py-2 text-sm">
      <span>{{ error }}</span>
    </div>

    <div class="card bg-base-300 shadow-md mt-2">
      <div class="card-body p-3 gap-2">
        <h2 class="card-title text-sm sm:text-base">Gráfico combinado</h2>
        <p class="text-[0.7rem] sm:text-xs text-base-content/60">
          Cada símbolo se muestra como una línea de color diferente.
        </p>
        <div class="mt-2 relative h-72 sm:h-80 md:h-[26rem]">
          <canvas ref="combinedCanvasRef" class="w-full h-full" />
        </div>
      </div>
    </div>

    <div class="card bg-base-300 shadow-md mt-2">
      <div class="card-body p-3 gap-3">
        <h2 class="card-title text-sm sm:text-base">Símbolos comparados</h2>
        <MultiCompareSymbolsPanel
          v-model:newSymbol="newSymbol"
          :symbols="symbols"
          :maxSymbols="maxSymbols"
          :enrichedSymbols="enrichedSymbols"
          @add-symbol="addSymbolFromInput"
          @remove-symbol="removeSymbol"
        />
      </div>
    </div>
  </section>
</template>
