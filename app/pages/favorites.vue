<script setup lang="ts">
// Página de favoritos (migrada de views/favorites/FavoritesView.vue)
import {
  PlusIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import type { MarketSymbolDocument, TrendAnalysisResult } from '~/composables/useApi'

definePageMeta({
  middleware: 'auth',
})

interface FavoriteRow {
  symbol: string
  name: string | null
  typeLabel: string
  price: number | null
  volume: number | null
  change: number | null
  percentChange: number | null
  direction: 'ganador' | 'perdedor' | 'plano' | null
}

const router = useRouter()
const { SymbolPreferencesAPI } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const favorites = ref<string[]>([])
const rows = ref<FavoriteRow[]>([])

const updatingFavorites = ref(false)
const newFavoriteSymbol = ref('')
const refreshingFavorites = ref(false)

// Trend modal
const trendModalOpen = ref(false)
const trendLoading = ref(false)
const trendError = ref<string | null>(null)
const trendResult = ref<TrendAnalysisResult | null>(null)
const analyzingSymbol = ref<string | null>(null)

const selectedProfile = ref<'intradia' | 'corto' | 'largo'>('corto')
const selectedModel = ref<'xgboost' | 'random_forest'>('xgboost')

const TREND_PREFS_KEY = 'trend_preferences'

const goToChart = (symbol: string) => {
  router.push({ path: '/chart', query: { symbol: symbol.toUpperCase() } })
}

const deriveTypeLabel = (doc: MarketSymbolDocument | null | undefined): string => {
  if (!doc) return 'N/D'
  const market = (doc.market || '').toLowerCase()
  if (market === 'crypto') return 'Crypto'
  if (market === 'stocks') return 'Acción'
  return doc.market || 'Desconocido'
}

const mapMarketSymbolToRow = (doc: MarketSymbolDocument): FavoriteRow => {
  let direction: 'ganador' | 'perdedor' | 'plano' | null = null
  if (doc.change != null) {
    if (doc.change > 0) direction = 'ganador'
    else if (doc.change < 0) direction = 'perdedor'
    else direction = 'plano'
  }

  return {
    symbol: doc.symbol.toUpperCase(),
    name: doc.name ?? null,
    typeLabel: deriveTypeLabel(doc),
    price: doc.price,
    volume: doc.volume,
    change: doc.change,
    percentChange: doc.percent_change,
    direction,
  }
}

const formatPrice = (value: number | null): string => value != null ? value.toFixed(2) : '-'
const formatInt = (value: number | null): string => value != null ? value.toLocaleString('es-ES') : '-'
const formatPercent = (value: number | null): string => value != null ? `${value.toFixed(2)} %` : '-'

const loadFavoritesTable = async () => {
  loading.value = true
  error.value = null
  try {
    const favResp = await SymbolPreferencesAPI.getSymbols()
    if (!favResp.success) {
      error.value = favResp.error ?? 'Error al obtener favoritos'
      favorites.value = []
      rows.value = []
      return
    }

    const symbols = (favResp.data || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean)
    favorites.value = symbols

    if (!symbols.length) {
      rows.value = []
      return
    }

    const detailsResp = await SymbolPreferencesAPI.getFavoriteDetails()
    if (!detailsResp.success) {
      error.value = detailsResp.error ?? 'Error al obtener detalles'
      rows.value = []
      return
    }

    rows.value = (detailsResp.data || []).map(mapMarketSymbolToRow)
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado'
    rows.value = []
  } finally {
    loading.value = false
  }
}

const addFavoriteFromInput = async () => {
  const sym = newFavoriteSymbol.value.trim().toUpperCase()
  if (!sym) return

  updatingFavorites.value = true
  try {
    const resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
    if (resp.success) {
      newFavoriteSymbol.value = ''
      await loadFavoritesTable()
    }
  } catch (e) {
    console.error('Error agregando favorito', e)
  } finally {
    updatingFavorites.value = false
  }
}

const removeFavorite = async (symbol: string) => {
  updatingFavorites.value = true
  try {
    const resp = await SymbolPreferencesAPI.removeSymbols({ symbol })
    if (resp.success) {
      await loadFavoritesTable()
    }
  } catch (e) {
    console.error('Error quitando favorito', e)
  } finally {
    updatingFavorites.value = false
  }
}

const refreshFavoritesFromAlpaca = async () => {
  refreshingFavorites.value = true
  try {
    const resp = await SymbolPreferencesAPI.refreshFavorites()
    if (resp.success) {
      rows.value = (resp.data || []).map(mapMarketSymbolToRow)
    }
  } catch (e) {
    console.error('Error actualizando favoritos', e)
  } finally {
    refreshingFavorites.value = false
  }
}

const openTrendModal = async (symbol: string) => {
  trendModalOpen.value = true
  trendLoading.value = true
  trendError.value = null
  trendResult.value = null
  analyzingSymbol.value = symbol.toUpperCase()

  try {
    const resp = await SymbolPreferencesAPI.getFavoriteTrend({
      symbol: symbol.toUpperCase(),
      profile: selectedProfile.value,
      model_type: selectedModel.value,
    })
    if (!resp.success) {
      trendError.value = resp.error ?? 'Error al calcular tendencia'
      return
    }
    trendResult.value = resp.data
  } catch (e: unknown) {
    trendError.value = (e as Error)?.message ?? 'Error inesperado'
  } finally {
    trendLoading.value = false
  }
}

const closeTrendModal = () => {
  trendModalOpen.value = false
  trendResult.value = null
  analyzingSymbol.value = null
}

const loadTrendPreferencesFromStorage = () => {
  if (!import.meta.client) return
  try {
    const stored = localStorage.getItem(TREND_PREFS_KEY)
    if (!stored) return
    const prefs = JSON.parse(stored)
    if (['intradia', 'corto', 'largo'].includes(prefs.profile)) {
      selectedProfile.value = prefs.profile
    }
    if (['xgboost', 'random_forest'].includes(prefs.model_type)) {
      selectedModel.value = prefs.model_type
    }
  } catch { /* ignore */ }
}

const saveTrendPreferencesToStorage = () => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(TREND_PREFS_KEY, JSON.stringify({
      profile: selectedProfile.value,
      model_type: selectedModel.value,
    }))
  } catch { /* ignore */ }
}

watch(selectedProfile, saveTrendPreferencesToStorage)
watch(selectedModel, saveTrendPreferencesToStorage)

onMounted(() => {
  loadTrendPreferencesFromStorage()
  loadFavoritesTable()
})
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Mis símbolos favoritos</h1>
        <p class="text-xs text-base-content/70">Vista resumida con precio, volumen y desempeño diario.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-xs">Perfil</span>
            <select v-model="selectedProfile" class="select select-xs select-bordered">
              <option value="intradia">Intradía</option>
              <option value="corto">Corto</option>
              <option value="largo">Largo</option>
            </select>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-xs">Modelo</span>
            <select v-model="selectedModel" class="select select-xs select-bordered">
              <option value="xgboost">XGBoost</option>
              <option value="random_forest">Random Forest</option>
            </select>
          </label>
        </div>

        <div class="join join-sm">
          <input
            v-model="newFavoriteSymbol"
            type="text"
            placeholder="Agregar símbolo"
            class="input input-sm input-bordered join-item w-28"
            @keyup.enter="addFavoriteFromInput"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary join-item"
            :disabled="updatingFavorites || !newFavoriteSymbol"
            @click="addFavoriteFromInput"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
        </div>

        <button type="button" class="btn btn-sm btn-outline" :disabled="loading" @click="loadFavoritesTable">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          :disabled="refreshingFavorites"
          @click="refreshFavoritesFromAlpaca"
        >
          <span v-if="refreshingFavorites" class="loading loading-spinner loading-xs" />
          <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
          Actualizar precios
        </button>
      </div>
    </header>

    <div v-if="loading" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>
    </div>

    <div v-else-if="error" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <div class="alert alert-error py-2 text-sm">{{ error }}</div>
      </div>
    </div>

    <div v-else-if="!favorites.length" class="card bg-base-300 shadow-md">
      <div class="card-body text-sm text-base-content/70">
        <p>No tienes símbolos favoritos. Puedes añadirlos desde el Screener o usando el campo superior.</p>
      </div>
    </div>

    <div v-else class="card bg-base-300 shadow-md">
      <div class="card-body p-0 overflow-x-auto">
        <table class="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Símbolo</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Volumen</th>
              <th class="text-right">Cambio %</th>
              <th class="text-right">Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.symbol">
              <td class="font-mono">{{ row.symbol }}</td>
              <td>{{ row.name || '-' }}</td>
              <td>{{ row.typeLabel }}</td>
              <td class="text-right">{{ formatPrice(row.price) }}</td>
              <td class="text-right">{{ formatInt(row.volume) }}</td>
              <td
                class="text-right"
                :class="{
                  'text-success': row.percentChange != null && row.percentChange > 0,
                  'text-error': row.percentChange != null && row.percentChange < 0,
                }"
              >
                {{ formatPercent(row.percentChange) }}
              </td>
              <td class="text-right">
                <span v-if="row.direction === 'ganador'" class="badge badge-success badge-xs">Ganador</span>
                <span v-else-if="row.direction === 'perdedor'" class="badge badge-error badge-xs">Perdedor</span>
                <span v-else class="badge badge-ghost badge-xs">Plano</span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button type="button" class="btn btn-ghost btn-xs" @click="goToChart(row.symbol)" title="Ver gráfico">
                    <ChartBarSquareIcon class="w-4 h-4" />
                  </button>
                  <button type="button" class="btn btn-ghost btn-xs" @click="openTrendModal(row.symbol)" title="Ver tendencia">
                    <ArrowTrendingUpIcon class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-error"
                    :disabled="updatingFavorites"
                    @click="removeFavorite(row.symbol)"
                    title="Quitar"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="8" class="text-center py-4 text-sm text-base-content/70">
                No se pudo obtener información de mercado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Modal de Tendencia -->
  <dialog v-if="trendModalOpen" class="modal modal-open">
    <div class="modal-box max-w-2xl w-full space-y-4">
      <div class="flex items-center justify-between border-b border-base-content/10 pb-3">
        <h3 class="font-bold text-xl flex items-center gap-2">
          <ArrowTrendingUpIcon class="w-6 h-6 text-primary" />
          Análisis de Tendencia
          <span v-if="analyzingSymbol" class="badge badge-primary badge-lg font-mono">{{ analyzingSymbol }}</span>
        </h3>
        <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="closeTrendModal">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div v-if="trendLoading" class="flex flex-col items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary" />
        <p class="mt-3 text-sm text-base-content/70">Analizando {{ analyzingSymbol }}...</p>
      </div>

      <div v-else-if="trendError" class="alert alert-error">
        <XMarkIcon class="w-5 h-5" />
        <span>{{ trendError }}</span>
      </div>

      <div v-else-if="trendResult" class="space-y-4">
        <div class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h4 class="card-title text-sm">Predicción ML</h4>
            <div class="flex items-center justify-between mt-2">
              <span class="text-base-content/70">Tendencia:</span>
              <span
                class="badge badge-lg font-semibold"
                :class="{
                  'badge-success': trendResult.trend_code === 1,
                  'badge-error': trendResult.trend_code === -1,
                  'badge-warning': trendResult.trend_code === 0,
                }"
              >
                {{ trendResult.trend_label }}
              </span>
            </div>

            <div v-if="trendResult.probabilities" class="mt-3 space-y-2">
              <p class="text-xs font-semibold text-base-content/70">Probabilidades:</p>
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">Alcista</span>
                  <progress class="progress progress-success flex-1 h-2" :value="(trendResult.probabilities['1'] || 0) * 100" max="100" />
                  <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['1'] || 0) * 100).toFixed(1) }}%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">Lateral</span>
                  <progress class="progress progress-warning flex-1 h-2" :value="(trendResult.probabilities['0'] || 0) * 100" max="100" />
                  <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['0'] || 0) * 100).toFixed(1) }}%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs w-16">Bajista</span>
                  <progress class="progress progress-error flex-1 h-2" :value="(trendResult.probabilities['-1'] || 0) * 100" max="100" />
                  <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['-1'] || 0) * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-base-content/10 text-xs text-base-content/60">
              <span>Muestras: {{ trendResult.n_samples }}</span>
            </div>
          </div>
        </div>

        <!-- Fair Value (si existe) -->
        <div v-if="trendResult.fair_value" class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h4 class="card-title text-sm flex items-center justify-between">
              <span>Fair Value</span>
              <span
                class="badge"
                :class="{
                  'badge-success': trendResult.fair_value.signals.recommendation_color === 'success',
                  'badge-error': trendResult.fair_value.signals.recommendation_color === 'error',
                  'badge-warning': trendResult.fair_value.signals.recommendation_color === 'warning',
                }"
              >
                {{ trendResult.fair_value.signals.recommendation }}
              </span>
            </h4>

            <div class="grid grid-cols-2 gap-2 mt-2">
              <div class="stat bg-base-300 rounded-lg p-2">
                <div class="stat-title text-[10px]">Precio Actual</div>
                <div class="stat-value text-lg font-mono">${{ trendResult.fair_value.current_price }}</div>
              </div>
              <div class="stat bg-base-300 rounded-lg p-2">
                <div class="stat-title text-[10px]">Z-Score</div>
                <div
                  class="stat-value text-lg font-mono"
                  :class="{
                    'text-success': trendResult.fair_value.zscore <= -1,
                    'text-error': trendResult.fair_value.zscore >= 1,
                  }"
                >
                  {{ trendResult.fair_value.zscore }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-2">
              <div class="bg-success/10 border border-success/30 rounded-lg p-2">
                <p class="text-[10px] text-success font-semibold uppercase">Zona de Compra</p>
                <p class="font-mono text-sm">${{ trendResult.fair_value.buy_range.min }} - ${{ trendResult.fair_value.buy_range.max }}</p>
              </div>
              <div class="bg-error/10 border border-error/30 rounded-lg p-2">
                <p class="text-[10px] text-error font-semibold uppercase">Zona de Venta</p>
                <p class="font-mono text-sm">${{ trendResult.fair_value.sell_range.min }} - ${{ trendResult.fair_value.sell_range.max }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action pt-2 border-t border-base-content/10">
        <button type="button" class="btn btn-primary btn-sm" @click="goToChart(analyzingSymbol || '')">
          <ChartBarSquareIcon class="w-4 h-4 mr-1" />
          Ver Gráfico
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="closeTrendModal">Cerrar</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click.prevent="closeTrendModal">
      <button type="button">Cerrar</button>
    </form>
  </dialog>
</template>
