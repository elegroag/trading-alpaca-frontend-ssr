<script setup lang="ts">
// Toolbar del gráfico de precios (migrado de components/PriceChartToolbar.vue)
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

type DrawingMode = 'none' | 'support' | 'resistance' | 'trend'

interface TimeframeOption {
  value: string
  label: string
}

interface XTickOption {
  value: number
  label: string
}

const props = defineProps<{
  symbol: string
  timeframe: string
  timeframes: TimeframeOption[]
  xTicksLimit: number
  xTickOptions: XTickOption[]
  rangeSteps: number[]
  rangeIndex: number
  loading: boolean
  isFullscreen: boolean
  drawingMode: DrawingMode
}>()

const emit = defineEmits<{
  (e: 'update:symbol', value: string): void
  (e: 'update:timeframe', value: string): void
  (e: 'update:xTicksLimit', value: number): void
  (e: 'update:rangeIndex', value: number): void
  (e: 'submit'): void
  (e: 'reset-zoom'): void
  (e: 'toggle-fullscreen'): void
  (e: 'set-drawing-mode', mode: DrawingMode): void
  (e: 'clear-annotations'): void
}>()

const symbolModel = computed({
  get: () => props.symbol,
  set: (value: string) => emit('update:symbol', value),
})

const timeframeModel = computed({
  get: () => props.timeframe,
  set: (value: string) => emit('update:timeframe', value),
})

const xTicksLimitModel = computed({
  get: () => props.xTicksLimit,
  set: (value: number) => emit('update:xTicksLimit', value),
})

const rangeIndexModel = computed({
  get: () => props.rangeIndex,
  set: (value: number) => emit('update:rangeIndex', value),
})
</script>

<template>
  <form class="flex flex-wrap items-end gap-2" @submit.prevent="emit('submit')">
    <label class="form-control w-28 sm:w-36">
      <span class="label">
        <span class="label-text text-xs">Símbolo</span>
      </span>
      <input
        v-model="symbolModel"
        type="text"
        class="input input-bordered input-sm uppercase"
        placeholder="AAPL"
      />
    </label>

    <label class="form-control w-32 sm:w-40">
      <span class="label">
        <span class="label-text text-xs">Timeframe</span>
      </span>
      <select v-model="timeframeModel" class="select select-bordered select-sm">
        <option v-for="tf in props.timeframes" :key="tf.value" :value="tf.value">
          {{ tf.label }}
        </option>
      </select>
    </label>

    <label class="form-control w-32 sm:w-36">
      <span class="label">
        <span class="label-text text-xs">Fechas eje X</span>
      </span>
      <select v-model.number="xTicksLimitModel" class="select select-bordered select-sm">
        <option v-for="opt in props.xTickOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }} ({{ opt.value }})
        </option>
      </select>
    </label>

    <div class="form-control w-48 sm:w-56">
      <span class="label">
        <span class="label-text text-xs">Rango</span>
      </span>
      <div class="w-full max-w-xs">
        <input
          type="range"
          min="0"
          :max="props.rangeSteps.length ? props.rangeSteps.length - 1 : 0"
          v-model.number="rangeIndexModel"
          class="range range-xs"
          step="1"
        />
        <div class="flex justify-between px-2.5 mt-1 text-[0.6rem]">
          <span v-for="step in props.rangeSteps" :key="step">|</span>
        </div>
        <div class="flex justify-between px-2.5 mt-1 text-[0.6rem]">
          <span
            v-for="(step, idx) in props.rangeSteps"
            :key="step + '-label'"
            :class="idx === rangeIndexModel ? 'font-semibold' : ''"
          >
            {{ step }}x
          </span>
        </div>
      </div>
    </div>

    <button type="submit" class="btn btn-primary btn-sm" :disabled="props.loading" title="Actualizar gráfico">
      <span v-if="props.loading" class="loading loading-spinner loading-xs mr-1" />
      <ArrowPathIcon class="w-4 h-4" />
    </button>

    <button type="button" class="btn btn-ghost btn-xs" @click="emit('reset-zoom')" title="Reset zoom">
      <ArrowUturnLeftIcon class="w-4 h-4" />
    </button>

    <button
      type="button"
      class="btn btn-ghost btn-xs"
      @click="emit('toggle-fullscreen')"
      :title="props.isFullscreen ? 'Cerrar pantalla completa' : 'Pantalla completa'"
    >
      <ArrowsPointingInIcon v-if="props.isFullscreen" class="w-4 h-4" />
      <ArrowsPointingOutIcon v-else class="w-4 h-4" />
    </button>

    <div class="flex items-center gap-1 ml-1">
      <button
        type="button"
        class="btn btn-xs"
        :class="props.drawingMode === 'support' ? 'btn-primary' : 'btn-ghost'"
        title="Dibujar línea de soporte"
        @click="emit('set-drawing-mode', 'support')"
      >
        S
      </button>
      <button
        type="button"
        class="btn btn-xs"
        :class="props.drawingMode === 'resistance' ? 'btn-primary' : 'btn-ghost'"
        title="Dibujar línea de resistencia"
        @click="emit('set-drawing-mode', 'resistance')"
      >
        R
      </button>
      <button
        type="button"
        class="btn btn-xs"
        :class="props.drawingMode === 'trend' ? 'btn-primary' : 'btn-ghost'"
        title="Dibujar trendline"
        @click="emit('set-drawing-mode', 'trend')"
      >
        TL
      </button>
      <button type="button" class="btn btn-xs btn-ghost" title="Limpiar dibujos" @click="emit('clear-annotations')">
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
  </form>
</template>
