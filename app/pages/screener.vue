<script setup lang="ts">
// Página de screener (migrada de views/screener/ScreenerView.vue)
import {
  ArrowPathIcon,
  PlusIcon,
  StarIcon,
  ChartBarSquareIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'
import type { MostActiveItem, MarketMoversData } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

const router = useRouter()
const { TradingAPI, SymbolPreferencesAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)

const mode = ref<'most-actives' | 'movers'>('most-actives')
const market = ref<'stocks' | 'crypto'>('stocks')
const by = ref<'volume' | 'trades'>('volume')
const limit = ref(10)

const mostActives = ref<MostActiveItem[]>([])
const movers = ref<MarketMoversData | null>(null)

const favorites = ref<string[]>([])
const loadingFavorites = ref(false)
const updatingFavorites = ref(false)
const newFavoriteSymbol = ref('')

const favoriteSet = computed(() => new Set(favorites.value.map((s) => s.toUpperCase())))

const isFavorite = (symbol: string | null | undefined): boolean => {
  if (!symbol) return false
  return favoriteSet.value.has(symbol.toUpperCase())
}

const goToChart = (symbol: string | null | undefined) => {
  if (!symbol) return
  router.push({ path: '/chart', query: { symbol: symbol.toUpperCase() } })
}

const toggleFavorite = async (symbol: string | null | undefined) => {
  if (!symbol) return
  const sym = symbol.toUpperCase()

  updatingFavorites.value = true
  try {
    let resp
    if (isFavorite(sym)) {
      resp = await SymbolPreferencesAPI.removeSymbols({ symbol: sym })
    } else {
      resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
    }

    if (resp.success) {
      favorites.value = resp.data || []
    }
  } catch (e) {
    console.error('Error actualizando favoritos', e)
  } finally {
    updatingFavorites.value = false
  }
}

const addFavoriteFromInput = async () => {
  const sym = newFavoriteSymbol.value.trim().toUpperCase()
  if (!sym) return

  updatingFavorites.value = true
  try {
    const resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
    if (resp.success) {
      favorites.value = resp.data || []
      newFavoriteSymbol.value = ''
    }
  } catch (e) {
    console.error('Error agregando favorito', e)
  } finally {
    updatingFavorites.value = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    if (mode.value === 'most-actives') {
      const resp = await TradingAPI.getMostActives({
        by: by.value,
        limit: limit.value,
        market: market.value,
      })
      if (!resp.success) {
        error.value = resp.error ?? 'Error al obtener most actives'
        return
      }
      mostActives.value = resp.data
      movers.value = null
    } else {
      const resp = await TradingAPI.getMarketMovers({
        limit: limit.value,
        market: market.value,
      })
      if (!resp.success) {
        error.value = resp.error ?? 'Error al obtener market movers'
        return
      }
      movers.value = resp.data
      mostActives.value = []
    }
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al cargar screener'
  } finally {
    loading.value = false
  }
}

const loadFavorites = async () => {
  loadingFavorites.value = true
  try {
    const resp = await SymbolPreferencesAPI.getSymbols()
    if (resp.success) {
      favorites.value = resp.data || []
    }
  } catch (e) {
    console.error('Error cargando favoritos', e)
  } finally {
    loadingFavorites.value = false
  }
}

onMounted(() => {
  loadData()
  loadFavorites()
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Screener de mercado</h1>
        <p class="text-xs text-base-content/70">Datos provistos por Alpaca Screener API.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="join join-sm">
          <button
            class="btn btn-sm join-item"
            :class="mode === 'most-actives' ? 'btn-primary' : 'btn-ghost'"
            @click="mode = 'most-actives'; loadData()"
          >
            Más activas
          </button>
          <button
            class="btn btn-sm join-item"
            :class="mode === 'movers' ? 'btn-primary' : 'btn-ghost'"
            @click="mode = 'movers'; loadData()"
          >
            Ganadoras/Perdedoras
          </button>
        </div>

        <select v-model="market" class="select select-sm select-bordered" @change="loadData">
          <option value="stocks">Acciones</option>
          <option value="crypto">Crypto</option>
        </select>

        <select
          v-if="mode === 'most-actives'"
          v-model="by"
          class="select select-sm select-bordered"
          @change="loadData"
        >
          <option value="volume">Por volumen</option>
          <option value="trades">Por trades</option>
        </select>

        <select v-model.number="limit" class="select select-sm select-bordered" @change="loadData">
          <option :value="10">Top 10</option>
          <option :value="20">Top 20</option>
          <option :value="50">Top 50</option>
        </select>

        <button type="button" class="btn btn-sm btn-outline" @click="loadData">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
        </button>
      </div>
    </header>

    <!-- Favoritos -->
    <section v-if="favorites.length" class="card bg-base-300 shadow-sm">
      <div class="card-body py-3 space-y-2">
        <div class="flex flex-wrap items-center gap-2 justify-between">
          <span class="text-xs font-semibold">Favoritos:</span>
          <div class="flex items-center gap-2">
            <input
              v-model="newFavoriteSymbol"
              type="text"
              placeholder="Agregar símbolo"
              class="input input-xs input-bordered w-28"
              @keyup.enter="addFavoriteFromInput"
            />
            <button
              type="button"
              class="btn btn-xs btn-primary"
              :disabled="updatingFavorites || !newFavoriteSymbol"
              @click="addFavoriteFromInput"
            >
              <PlusIcon class="w-3 h-3" />
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="sym in favorites"
            :key="sym"
            class="badge badge-outline badge-sm font-mono text-[11px]"
          >
            {{ sym }}
          </span>
        </div>
      </div>
    </section>

    <div v-if="loading" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>
    </div>

    <div v-else-if="error" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <div class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Most Actives -->
      <div v-if="mode === 'most-actives'" class="card bg-base-300 shadow-md">
        <div class="card-body p-0 overflow-x-auto">
          <table class="table table-zebra table-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Símbolo</th>
                <th>Nombre</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Volumen</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in mostActives"
                :key="item.symbol ?? idx"
                :class="isFavorite(item.symbol) ? 'bg-base-200/70' : ''"
              >
                <td>{{ idx + 1 }}</td>
                <td class="font-mono">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs px-1"
                    :disabled="updatingFavorites"
                    @click="toggleFavorite(item.symbol)"
                  >
                    <StarIconSolid v-if="isFavorite(item.symbol)" class="w-4 h-4 text-warning" />
                    <StarIcon v-else class="w-4 h-4" />
                  </button>
                  <span class="ml-1">{{ item.symbol }}</span>
                </td>
                <td>{{ item.name }}</td>
                <td class="text-right">
                  {{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}
                </td>
                <td class="text-right">
                  {{ item.volume?.toLocaleString('es-ES') ?? '-' }}
                </td>
                <td class="text-right">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    @click="goToChart(item.symbol)"
                  >
                    <ChartBarSquareIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!mostActives.length">
                <td colspan="6" class="text-center py-4 text-sm text-base-content/70">
                  No hay datos disponibles.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Market Movers -->
      <div v-else-if="mode === 'movers' && movers" class="grid gap-4 md:grid-cols-2">
        <div class="card bg-base-300 shadow-md">
          <div class="card-body p-0 overflow-x-auto">
            <h2 class="card-title px-4 pt-3 pb-1 text-sm">Top Ganadoras</h2>
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Símbolo</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cambio %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in movers.gainers" :key="`g-${item.symbol ?? idx}`">
                  <td>{{ idx + 1 }}</td>
                  <td class="font-mono">{{ item.symbol }}</td>
                  <td class="text-right">{{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}</td>
                  <td class="text-right text-success">
                    {{ item.percent_change != null ? `${item.percent_change.toFixed(2)}%` : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card bg-base-300 shadow-md">
          <div class="card-body p-0 overflow-x-auto">
            <h2 class="card-title px-4 pt-3 pb-1 text-sm">Top Perdedoras</h2>
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Símbolo</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cambio %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in movers.losers" :key="`l-${item.symbol ?? idx}`">
                  <td>{{ idx + 1 }}</td>
                  <td class="font-mono">{{ item.symbol }}</td>
                  <td class="text-right">{{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}</td>
                  <td class="text-right text-error">
                    {{ item.percent_change != null ? `${item.percent_change.toFixed(2)}%` : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
