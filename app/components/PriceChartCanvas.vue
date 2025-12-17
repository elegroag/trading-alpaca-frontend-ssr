<script setup lang="ts">
// Componente de gráfico con Chart.js (solo cliente)
import { Chart, type ChartConfiguration } from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { Bar } from '~/composables/useApi'

Chart.register(zoomPlugin, annotationPlugin)

type DrawingMode = 'none' | 'support' | 'resistance' | 'trend'
type PriceChartValuationBaseSma = 'sma20' | 'sma50'

const props = defineProps<{
  bars: Bar[]
  symbol: string
  timeframe: string
  xTicksLimit: number
  drawingMode: DrawingMode
  valuationRulesEnabled: boolean
  valuationBaseSma: PriceChartValuationBaseSma
  effectiveOverPct: number
  effectiveUnderPct: number
  realtimePrice?: number | null
}>()

const emit = defineEmits<{
  (e: 'bar-click', index: number): void
  (e: 'opportunities', value: { index: number; timestamp: string; price: number; type: 'overvalued' | 'undervalued' }[]): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const pendingTrendStart = ref<{ index: number; price: number } | null>(null)
const annotations = ref<Record<string, any>>({})

const clearAnnotations = () => {
  annotations.value = {}
  if (chart && (chart.options.plugins as any)?.annotation) {
    ;(chart.options.plugins as any).annotation.annotations = annotations.value
    chart.update()
  }
}

const resetZoom = () => {
  if (!chart) return
  ;(chart as any).resetZoom?.()
}

defineExpose({
  resetZoom,
  clearAnnotations,
})

const formatLabel = (iso: string, tf: string) => {
  const date = new Date(iso)
  if (tf.includes('Min') || tf.includes('H')) {
    return date.toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  return date.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const computeSMA = (values: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = Array(values.length).fill(null)
  if (period <= 0) return result

  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!
    if (i >= period) {
      sum -= values[i - period]!
    }
    if (i >= period - 1) {
      result[i] = sum / period
    }
  }
  return result
}

const buildOpportunities = (sorted: Bar[], overPoints: (number | null)[], underPoints: (number | null)[]) => {
  if (!props.valuationRulesEnabled) {
    emit('opportunities', [])
    return
  }

  const newOpps: { index: number; timestamp: string; price: number; type: 'overvalued' | 'undervalued' }[] = []
  for (let i = 0; i < sorted.length; i++) {
    const bar = sorted[i]
    if (!bar) continue

    const over = overPoints[i]
    const under = underPoints[i]

    if (over != null) {
      newOpps.push({
        index: i,
        timestamp: bar.timestamp,
        price: over,
        type: 'overvalued',
      })
    } else if (under != null) {
      newOpps.push({
        index: i,
        timestamp: bar.timestamp,
        price: under,
        type: 'undervalued',
      })
    }
  }

  newOpps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  emit('opportunities', newOpps.slice(-20).reverse())
}

const updateRealtimePrice = (price: number) => {
  if (!chart) return

  const datasets = chart.data.datasets as any[]
  const priceDataset = datasets.find((d) => d.label === `${props.symbol.toUpperCase()} - Cierre`)
  const sma20Dataset = datasets.find((d) => d.label === 'SMA 20')
  const sma50Dataset = datasets.find((d) => d.label === 'SMA 50')
  const currentPriceDataset = datasets.find((d) => d.label === 'Precio actual')
  const overvaluedDataset = datasets.find((d) => d.label === 'Sobrevalorado')
  const undervaluedDataset = datasets.find((d) => d.label === 'Infravalorado')

  if (!priceDataset) return
  const arr = priceDataset.data as number[]
  if (!arr || !arr.length) return

  const prev = arr.length > 1 ? (arr[arr.length - 2] as number) : (arr[arr.length - 1] as number)
  arr[arr.length - 1] = price

  if (price >= prev) {
    priceDataset.borderColor = 'rgb(34,197,94)'
    priceDataset.backgroundColor = 'rgba(34,197,94,0.15)'
  } else {
    priceDataset.borderColor = 'rgb(248,113,113)'
    priceDataset.backgroundColor = 'rgba(248,113,113,0.15)'
  }

  if (sma20Dataset || sma50Dataset) {
    const period20 = Math.min(20, Math.max(2, arr.length))
    const period50 = Math.min(50, Math.max(2, arr.length))
    if (sma20Dataset) sma20Dataset.data = computeSMA(arr, period20)
    if (sma50Dataset) sma50Dataset.data = computeSMA(arr, period50)
  }

  if (currentPriceDataset) {
    const labelsCount = Array.isArray(chart.data.labels) ? chart.data.labels.length : 0
    currentPriceDataset.data = Array(labelsCount).fill(price)
  }

  const labelsCount = Array.isArray(chart.data.labels) ? chart.data.labels.length : arr.length
  const overPoints: (number | null)[] = Array(labelsCount).fill(null)
  const underPoints: (number | null)[] = Array(labelsCount).fill(null)

  if (props.valuationRulesEnabled && (sma20Dataset || sma50Dataset)) {
    const baseArray =
      props.valuationBaseSma === 'sma50'
        ? ((sma50Dataset?.data as (number | null)[]) || [])
        : ((sma20Dataset?.data as (number | null)[]) || [])

    const overFactor = 1 + props.effectiveOverPct / 100
    const underFactor = 1 - props.effectiveUnderPct / 100

    for (let i = 0; i < labelsCount && i < arr.length; i++) {
      const base = baseArray[i]
      const p = arr[i]
      if (base == null || p == null) continue
      if (p >= (base as number) * overFactor) {
        overPoints[i] = p
      } else if (p <= (base as number) * underFactor) {
        underPoints[i] = p
      }
    }
  }

  if (overvaluedDataset) overvaluedDataset.data = overPoints
  if (undervaluedDataset) undervaluedDataset.data = underPoints

  const sorted = [...props.bars].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  buildOpportunities(sorted, overPoints, underPoints)

  chart.update('none')
}

const handleCanvasDblClick = (event: MouseEvent) => {
  if (!chart) return
  if (props.drawingMode !== 'none') return

  const elements = chart.getElementsAtEventForMode(
    event as any,
    'nearest',
    { intersect: true },
    false,
  ) as any[]

  if (!elements || !elements.length) return

  const priceElement = elements.find((e: any) => e.datasetIndex === 0) || elements[0]
  if (!priceElement || typeof priceElement.index !== 'number') return

  emit('bar-click', priceElement.index)
}

const handleCanvasContextMenu = (event: MouseEvent) => {
  if (!chart) return
  const annos = annotations.value
  if (!annos || !Object.keys(annos).length) return

  const scales: any = (chart as any).scales
  const yScale = scales?.y
  const xScale = scales?.x
  if (!yScale) return

  const canvasEl = chart.canvas as HTMLCanvasElement
  const rect = canvasEl.getBoundingClientRect()
  const xPixel = event.clientX - rect.left
  const yPixel = event.clientY - rect.top

  const price = yScale.getValueForPixel(yPixel) as number
  const labels = (chart.data.labels as any[]) || []

  let xValNum: number | null = null
  if (xScale && typeof xScale.getValueForPixel === 'function') {
    const rawX = xScale.getValueForPixel(xPixel)
    if (typeof rawX === 'number') {
      xValNum = rawX
    } else if (typeof rawX === 'string' && Array.isArray(labels)) {
      const idx = labels.indexOf(rawX)
      if (idx >= 0) xValNum = idx
    }
  }

  let bestId: string | null = null
  let bestDist = Infinity

  Object.entries(annos).forEach(([id, ann]: [string, any]) => {
    if (!ann || ann.type !== 'line') return

    let yLine: number | null = null

    if (typeof ann.yMin === 'number' && typeof ann.yMax === 'number' && ann.yMin === ann.yMax) {
      yLine = ann.yMin
    } else if (
      xValNum != null &&
      typeof ann.xMin !== 'undefined' &&
      typeof ann.xMax !== 'undefined' &&
      typeof ann.yMin === 'number' &&
      typeof ann.yMax === 'number'
    ) {
      const xMinIdx = typeof ann.xMin === 'string' && Array.isArray(labels) ? labels.indexOf(ann.xMin) : ann.xMin
      const xMaxIdx = typeof ann.xMax === 'string' && Array.isArray(labels) ? labels.indexOf(ann.xMax) : ann.xMax

      if (typeof xMinIdx === 'number' && typeof xMaxIdx === 'number' && xMaxIdx !== xMinIdx) {
        const t = (xValNum - xMinIdx) / (xMaxIdx - xMinIdx)
        if (t >= 0 && t <= 1) {
          yLine = ann.yMin + t * (ann.yMax - ann.yMin)
        }
      }
    }

    if (yLine == null) return
    const dist = Math.abs(price - yLine)
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  })

  const valueRange = (yScale.max as number) - (yScale.min as number)
  const tolerance = valueRange * 0.01

  if (!bestId || bestDist > tolerance) return

  const { [bestId]: _removed, ...rest } = annos
  annotations.value = rest

  if ((chart.options.plugins as any)?.annotation) {
    ;(chart.options.plugins as any).annotation.annotations = annotations.value
  }

  chart.update()
}

const buildChart = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const sorted = [...props.bars].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const labels = sorted.map((b) => formatLabel(b.timestamp, props.timeframe))
  const prices = sorted.map((b) => b.close)
  const volumes = sorted.map((b) => b.volume)

  const period20 = Math.min(20, Math.max(2, prices.length))
  const period50 = Math.min(50, Math.max(2, prices.length))

  const sma20 = computeSMA(prices, period20)
  const sma50 = computeSMA(prices, period50)

  const overvaluedPoints: (number | null)[] = Array(prices.length).fill(null)
  const undervaluedPoints: (number | null)[] = Array(prices.length).fill(null)

  if (props.valuationRulesEnabled) {
    const baseArray = props.valuationBaseSma === 'sma50' ? sma50 : sma20
    const overFactor = 1 + props.effectiveOverPct / 100
    const underFactor = 1 - props.effectiveUnderPct / 100

    for (let i = 0; i < prices.length; i++) {
      const base = baseArray[i]
      const price = prices[i]
      if (base == null || price == null) continue
      if (price >= (base as number) * overFactor) {
        overvaluedPoints[i] = price
      } else if (price <= (base as number) * underFactor) {
        undervaluedPoints[i] = price
      }
    }
  }

  buildOpportunities(sorted, overvaluedPoints, undervaluedPoints)

  if (prices.length === 0) {
    if (chart) {
      chart.destroy()
      chart = null
    }
    return
  }

  const firstPrice = prices[0] as number
  const lastPrice = prices[prices.length - 1] as number
  const up = lastPrice >= firstPrice

  const borderColor = up ? 'rgb(34,197,94)' : 'rgb(248,113,113)'
  const backgroundColor = up ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)'

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `${props.symbol.toUpperCase()} - Cierre`,
          data: prices,
          borderColor,
          backgroundColor,
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 3,
          fill: true,
        },
        {
          label: 'SMA 20',
          data: sma20,
          borderColor: 'rgba(96,165,250,0.9)',
          borderWidth: 1.5,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [2, 2],
          fill: false,
        },
        {
          label: 'SMA 50',
          data: sma50,
          borderColor: 'rgba(251,191,36,0.95)',
          borderWidth: 1.5,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 0,
          borderDash: [4, 2],
          fill: false,
        },
        {
          label: 'Sobrevalorado',
          data: overvaluedPoints,
          borderColor: 'transparent',
          backgroundColor: 'rgb(248,113,113)',
          pointRadius: 3,
          pointHoverRadius: 5,
          showLine: false,
        } as any,
        {
          label: 'Infravalorado',
          data: undervaluedPoints,
          borderColor: 'transparent',
          backgroundColor: 'rgb(170,120,220)',
          pointRadius: 3,
          pointHoverRadius: 5,
          showLine: false,
        } as any,
        {
          type: 'bar',
          label: 'Volumen',
          data: volumes,
          yAxisID: 'yVolume',
          backgroundColor: 'rgba(59,130,246,0.35)',
          borderWidth: 0,
          barPercentage: 0.5,
          categoryPercentage: 0.7,
          maxBarThickness: 14,
        },
        {
          label: 'Precio actual',
          data: Array(labels.length).fill(lastPrice),
          borderColor: 'rgba(248,250,252,0.8)',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      onClick(...args) {
        const active = (args[1] as any[]) || []
        if (!active || !active.length) return

        const priceElement = active.find((e: any) => e.datasetIndex === 0) || active[0]
        if (!priceElement || typeof priceElement.index !== 'number') return

        const index = priceElement.index
        const bar = sorted[index]
        if (!bar) return

        const price = bar.close

        if (props.drawingMode === 'support' || props.drawingMode === 'resistance') {
          const id = `hline-${Date.now()}-${Object.keys(annotations.value).length}`
          const color = props.drawingMode === 'support' ? 'rgb(255,165,0)' : 'rgba(248,113,113,0.9)'

          annotations.value = {
            ...annotations.value,
            [id]: {
              type: 'line',
              yMin: price,
              yMax: price,
              borderColor: color,
              borderWidth: 1,
              label: {
                display: true,
                content: props.drawingMode === 'support' ? 'Soporte' : 'Resistencia',
                position: 'start',
                backgroundColor: 'rgba(15,23,42,0.8)',
                color: '#e5e7eb',
              },
            },
          }

          if (chart && (chart.options.plugins as any)?.annotation) {
            ;(chart.options.plugins as any).annotation.annotations = annotations.value
            chart.update()
          }

          return
        }

        if (props.drawingMode === 'trend') {
          if (!pendingTrendStart.value) {
            pendingTrendStart.value = { index, price }
            return
          }

          const start = pendingTrendStart.value
          const labelsArr2 = chart?.data.labels as any
          const xMin = Array.isArray(labelsArr2) ? labelsArr2[start.index] : start.index
          const xMax = Array.isArray(labelsArr2) ? labelsArr2[index] : index

          const id = `trend-${Date.now()}-${Object.keys(annotations.value).length}`

          annotations.value = {
            ...annotations.value,
            [id]: {
              type: 'line',
              xMin,
              xMax,
              yMin: start.price,
              yMax: price,
              borderColor: 'rgba(59,130,246,0.9)',
              borderWidth: 1,
            },
          }

          if (chart && (chart.options.plugins as any)?.annotation) {
            ;(chart.options.plugins as any).annotation.annotations = annotations.value
            chart.update()
          }

          pendingTrendStart.value = null
          return
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#e5e7eb' },
        },
        title: {
          display: true,
          text: `${props.symbol.toUpperCase()} - ${props.timeframe}`,
          color: '#e5e7eb',
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.9)',
          titleColor: '#e5e7eb',
          bodyColor: '#e5e7eb',
          callbacks: {
            label(context) {
              const v = context.parsed.y
              if (v == null) return ''
              const label = context.dataset.label || ''
              if (label === 'Volumen') {
                const numeric = Number(v)
                if (Number.isNaN(numeric)) return `Volumen: ${v}`
                if (numeric >= 1000000) return `Volumen: ${(numeric / 1000000).toFixed(1)}M`
                if (numeric >= 1000) return `Volumen: ${Math.round(numeric / 1000)}K`
                return `Volumen: ${numeric.toFixed(0)}`
              }
              return `${label || 'Precio'}: $${v.toFixed(2)}`
            },
          },
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
          pan: {
            enabled: true,
            mode: 'x',
          },
        },
        annotation: {
          annotations: annotations.value,
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.2)' },
          ticks: {
            color: '#e5e7eb',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: props.xTicksLimit,
          },
        },
        y: {
          grid: { color: 'rgba(148,163,184,0.2)' },
          ticks: {
            color: '#e5e7eb',
            callback(value) {
              return `$${Number(value).toFixed(2)}`
            },
          },
        },
        yVolume: {
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            callback(value) {
              const numeric = Number(value)
              if (Number.isNaN(numeric)) return `${value}`
              if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1)}M`
              if (numeric >= 1000) return `${Math.round(numeric / 1000)}K`
              return numeric.toFixed(0)
            },
          },
        },
      },
    },
  }

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(ctx, config)
}

watch(() => props.bars, buildChart, { deep: true })
watch(() => props.timeframe, buildChart)
watch(() => props.symbol, buildChart)

watch(
  () => props.xTicksLimit,
  (val) => {
    if (!chart) return
    const scales: any = (chart.options as any).scales
    if (scales?.x?.ticks) {
      scales.x.ticks.maxTicksLimit = val
      chart.update()
    }
  },
)

watch(
  () => props.drawingMode,
  () => {
    pendingTrendStart.value = null
  },
)

watch(
  () => props.realtimePrice,
  (val) => {
    if (typeof val === 'number') {
      updateRealtimePrice(val)
    }
  },
)

onMounted(() => {
  buildChart()
})

onUnmounted(() => {
  if (chart) {
    chart.destroy()
    chart = null
  }
})
</script>

<template>
  <div class="w-full h-full">
    <canvas
      ref="canvasRef"
      class="w-full h-full"
      @dblclick="handleCanvasDblClick"
      @contextmenu.prevent="handleCanvasContextMenu"
    />
  </div>
</template>
