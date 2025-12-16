<script setup lang="ts">
// Componente de gráfico con Chart.js (solo cliente)
import { Chart, type ChartConfiguration } from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
import annotationPlugin from 'chartjs-plugin-annotation'
import type { Bar } from '~/composables/useApi'

Chart.register(zoomPlugin, annotationPlugin)

const props = defineProps<{
  bars: Bar[]
  symbol: string
  timeframe: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

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
      },
      scales: {
        x: {
          grid: { color: 'rgba(148,163,184,0.2)' },
          ticks: {
            color: '#e5e7eb',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
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
  <div class="w-full h-[400px] sm:h-[500px]">
    <canvas ref="canvasRef" />
  </div>
</template>
