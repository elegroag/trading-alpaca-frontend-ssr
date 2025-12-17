<script setup lang="ts">
import { computed } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

interface TimeframeOption {
  value: string
  label: string
}

interface XTickOption {
  value: number
  label: string
}

const props = defineProps<{
  timeframe: string
  timeframes: TimeframeOption[]
  xTicksLimit: number
  xTickOptions: XTickOption[]
  rangeSteps: number[]
  rangeIndex: number
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:timeframe', value: string): void
  (e: 'update:xTicksLimit', value: number): void
  (e: 'update:rangeIndex', value: number): void
  (e: 'submit'): void
}>()

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
  <form
    class="flex flex-wrap items-end gap-2"
    @submit.prevent="emit('submit')"
  >
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
      <select
        v-model.number="xTicksLimitModel"
        class="select select-bordered select-sm"
      >
        <option
          v-for="opt in props.xTickOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }} ({{ opt.value }})
        </option>
      </select>
    </label>

    <div class="form-control w-48 sm:w-56">
      <span class="label">
        <span class="label-text text-xs">Rango (multiplicador)</span>
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

    <button
      type="submit"
      class="btn btn-primary btn-sm"
      :disabled="props.loading"
      title="Actualizar gráficos"
    >
      <span
        v-if="props.loading"
        class="loading loading-spinner loading-xs mr-1"
      />
      <ArrowPathIcon class="w-4 h-4" />
    </button>
  </form>
</template>
