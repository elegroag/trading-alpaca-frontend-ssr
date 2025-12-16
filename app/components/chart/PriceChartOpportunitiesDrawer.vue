<script setup lang="ts">
// Drawer de oportunidades del gráfico (migrado de components/PriceChartOpportunitiesDrawer.vue)
import { SparklesIcon } from '@heroicons/vue/24/outline'

export interface PriceChartOpportunity {
  index: number
  timestamp: string
  price: number
  type: 'overvalued' | 'undervalued'
}

const props = defineProps<{
  opportunities: PriceChartOpportunity[]
  isFullscreen: boolean
  timeframe: string
  currentMultiplier: number
  currentLimit: number
}>()

const emit = defineEmits<{
  (e: 'select-opportunity', index: number): void
}>()
</script>

<template>
  <div class="drawer drawer-end w-full lg:w-auto">
    <input id="chart-opps-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex justify-end">
      <label for="chart-opps-drawer" class="btn btn-ghost btn-xs" title="Ver oportunidades">
        <SparklesIcon class="w-4 h-4" />
      </label>
    </div>
    <div class="drawer-side">
      <label for="chart-opps-drawer" aria-label="close sidebar" class="drawer-overlay" />
      <div class="menu bg-base-200 min-h-full w-80 max-w-xs p-4 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">
            Oportunidades
          </h2>
          <span class="badge badge-xs">
            {{ props.opportunities.length }}
          </span>
        </div>

        <p v-if="!props.opportunities.length" class="text-[0.7rem] text-base-content/60">
          No hay puntos sobre/infravalorados en el rango actual.
        </p>

        <ul v-else class="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          <li
            v-for="op in props.opportunities"
            :key="op.timestamp + op.type"
            class="btn btn-xs btn-ghost justify-between w-full px-2 h-auto py-1 gap-2 text-left"
            @click="emit('select-opportunity', op.index)"
          >
            <div class="flex flex-col text-[0.7rem]">
              <span
                :class="
                  op.type === 'overvalued'
                    ? 'text-error font-semibold'
                    : 'text-success font-semibold'
                "
              >
                {{ op.type === 'overvalued' ? 'Sobrevalorado' : 'Infravalorado' }}
              </span>
              <span class="text-base-content/70">
                {{
                  new Date(op.timestamp).toLocaleString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                }}
              </span>
            </div>
            <div class="text-right text-[0.7rem]">
              <div class="font-mono">${{ op.price.toFixed(2) }}</div>
            </div>
          </li>
        </ul>

        <p v-if="!props.isFullscreen" class="text-[0.7rem] text-base-content/60 pt-1">
          Datos históricos · Timeframe {{ props.timeframe }} · Rango
          {{ props.currentMultiplier }}x (máx. {{ props.currentLimit }} barras).
        </p>
      </div>
    </div>
  </div>
</template>
