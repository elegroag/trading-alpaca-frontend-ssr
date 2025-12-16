<script setup lang="ts">
// Componente de lista de posiciones (migrado de components/PositionsList.vue)
import { ChartBarSquareIcon } from '@heroicons/vue/24/outline'
import type { Position } from '~/composables/useApi'

const router = useRouter()
const { TradingAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const positions = ref<Position[]>([])

const loadPositions = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await TradingAPI.getPositions()
    if (response.success) {
      positions.value = response.data
    } else {
      error.value = response.error ?? 'Error al obtener posiciones'
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al obtener posiciones'
  } finally {
    loading.value = false
  }
}

const goToChart = (sym: string) => {
  const s = sym?.trim()
  if (!s) return
  router.push({ path: '/chart', query: { symbol: s.toUpperCase() } })
}

onMounted(() => {
  loadPositions()
})

defineExpose({ loadPositions })
</script>

<template>
  <section class="card bg-base-300 shadow-md">
    <div class="card-body p-4 gap-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="card-title text-base">Posiciones abiertas</h2>
      </div>

      <div v-if="loading" class="flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>

      <div v-else-if="error" class="alert alert-error py-2 text-sm">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="positions.length === 0" class="text-sm text-base-content/70">
        No hay posiciones abiertas.
      </div>

      <div v-else class="mt-2 space-y-2">
        <article
          v-for="pos in positions"
          :key="pos.symbol"
          class="card bg-base-200 border border-base-300 shadow-sm"
        >
          <div class="card-body p-3 gap-2">
            <header class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-info">{{ pos.symbol }}</h3>
                <span class="badge badge-sm badge-primary">
                  {{ pos.qty }} acciones
                </span>
                <span
                  v-if="pos.side"
                  class="badge badge-sm"
                  :class="pos.side === 'long' || pos.side === 'buy' ? 'badge-success' : 'badge-error'"
                >
                  {{ pos.side }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-xs btn-outline btn-info"
                  @click="goToChart(pos.symbol)"
                >
                  <ChartBarSquareIcon class="w-4 h-4 mr-1" />
                  Ver gráfico
                </button>
              </div>
            </header>

            <div class="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <div class="label-text-alt">Precio entrada</div>
                <div class="font-semibold">
                  ${{ pos.avg_entry_price.toFixed(2) }}
                </div>
              </div>
              <div>
                <div class="label-text-alt">Precio actual</div>
                <div class="font-semibold">
                  ${{ pos.current_price.toFixed(2) }}
                </div>
              </div>
              <div>
                <div class="label-text-alt">Valor mercado</div>
                <div class="font-semibold">
                  ${{ pos.market_value.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
              </div>
              <div>
                <div class="label-text-alt">P&L</div>
                <div
                  class="font-semibold"
                  :class="pos.unrealized_pl >= 0 ? 'text-success' : 'text-error'"
                >
                  {{ pos.unrealized_pl >= 0 ? '+' : '' }}${{ pos.unrealized_pl.toFixed(2) }}
                  ({{ pos.unrealized_plpc >= 0 ? '+' : '' }}{{ pos.unrealized_plpc.toFixed(2) }}%)
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
