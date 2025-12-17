<script setup lang="ts">
// Página de favoritos (migrada de views/favorites/FavoritesView.vue)
import {
  PlusIcon,
  ArrowPathIcon,
  ChartBarSquareIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useFavorites } from './useFavorites'
import { formatPrice, formatInt, formatChange, formatPercent } from './favorites.utils'

definePageMeta({
  middleware: 'auth',
})

const {
  loading,
  error,
  favoritesError,
  favorites,
  rows,
  updatingFavorites,
  newFavoriteSymbol,
  refreshingFavorites,
  trendModalOpen,
  trendLoading,
  trendError,
  trendResult,
  analyzingSymbol,
  selectedProfile,
  selectedModel,
  goToChart,
  goToCompare,
  addFavoriteFromInput,
  removeFavorite,
  refreshFavoritesFromAlpaca,
  openTrendModal,
  closeTrendModal,
  loadFavoritesTable,
  toastMessage,
  toastType,
} = useFavorites()

const hasData = computed(() => rows.value.length > 0)
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Mis símbolos favoritos</h1>
        <p class="text-xs text-base-content/70">
          Vista resumida de tus símbolos favoritos con precio, volumen, tipo y desempeño diario.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text text-xs">Perfil tendencia</span>
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
            placeholder="Agregar símbolo (ej: AAPL)"
            class="input input-sm input-bordered join-item w-32 sm:w-40"
            @keyup.enter.prevent="addFavoriteFromInput"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary join-item"
            :disabled="updatingFavorites || !newFavoriteSymbol"
            @click="addFavoriteFromInput"
          >
            <PlusIcon class="w-4 h-4 mr-1" />
            Agregar
          </button>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="loading || updatingFavorites"
          @click="loadFavoritesTable"
        >
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
        </button>

        <button
          type="button"
          class="btn btn-sm btn-secondary"
          :disabled="loading || updatingFavorites || refreshingFavorites"
          @click="refreshFavoritesFromAlpaca"
        >
          <span v-if="refreshingFavorites" class="loading loading-spinner loading-xs" />
          <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
          Actualizar precios
        </button>
      </div>
    </header>

    <section v-if="favoritesError" class="alert alert-error py-2 text-xs">
      <span>{{ favoritesError }}</span>
    </section>

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
        <p>No tienes símbolos favoritos configurados. Puedes añadirlos desde tu perfil o desde el Screener.</p>
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
              <th class="text-right">Volumen (1D)</th>
              <th class="text-right"># Trades*</th>
              <th class="text-right">Cambio</th>
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
              <td class="text-right">{{ formatInt(row.trades) }}</td>
              <td
                class="text-right"
                :class="{
                  'text-success': row.change != null && row.change > 0,
                  'text-error': row.change != null && row.change < 0,
                }"
              >
                {{ formatChange(row.change) }}
              </td>
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
                  <button type="button" class="btn btn-ghost btn-xs" @click="goToCompare(row.symbol)" title="Comparar">
                    <ArrowsRightLeftIcon class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    :disabled="trendLoading && analyzingSymbol === row.symbol"
                    @click="openTrendModal(row.symbol)"
                    title="Ver tendencia"
                  >
                    <ArrowTrendingUpIcon class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs text-error"
                    :disabled="updatingFavorites"
                    @click="removeFavorite(row.symbol)"
                    title="Quitar de favoritos"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!hasData">
              <td colspan="10" class="text-center py-4 text-sm text-base-content/70">
                No se pudo obtener información de mercado para tus favoritos.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer text-[10px] text-base-content/60">
        <span>* # Trades solo disponible para símbolos presentes en el Top "Most Actives" por número de trades.</span>
      </div>
    </div>
  </section>

  <!-- Modal de Tendencia -->
  <dialog v-if="trendModalOpen" class="modal modal-open">
    <div class="modal-box max-w-4xl w-full space-y-4">
      <div class="flex items-center justify-between border-b border-base-content/10 pb-3">
        <div>
          <h3 class="font-bold text-xl flex items-center gap-2">
            <ArrowTrendingUpIcon class="w-6 h-6 text-primary" />
            Análisis de Tendencia
            <span v-if="analyzingSymbol" class="badge badge-primary badge-lg font-mono">
              {{ analyzingSymbol }}
            </span>
          </h3>
          <p v-if="trendResult" class="text-xs text-base-content/60 mt-1">
            Perfil:
            <span class="font-medium">{{ trendResult.profile || selectedProfile }}</span>
            · Modelo:
            <span class="font-medium">{{ (trendResult.model_type || selectedModel) === 'random_forest' ? 'Random Forest' : 'XGBoost' }}</span>
            · Horizonte:
            <span class="font-medium">{{ trendResult.future_days || 0 }} días</span>
          </p>
        </div>
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
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body p-4">
              <h4 class="card-title text-sm flex items-center gap-2">
                <ChartBarSquareIcon class="w-5 h-5 text-secondary" />
                Predicción ML
              </h4>

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
                    <progress
                      class="progress progress-success flex-1 h-2"
                      :value="(trendResult.probabilities['1'] || 0) * 100"
                      max="100"
                    />
                    <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['1'] || 0) * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs w-16">Lateral</span>
                    <progress
                      class="progress progress-warning flex-1 h-2"
                      :value="(trendResult.probabilities['0'] || 0) * 100"
                      max="100"
                    />
                    <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['0'] || 0) * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs w-16">Bajista</span>
                    <progress
                      class="progress progress-error flex-1 h-2"
                      :value="(trendResult.probabilities['-1'] || 0) * 100"
                      max="100"
                    />
                    <span class="text-xs font-mono w-12 text-right">{{ ((trendResult.probabilities['-1'] || 0) * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 pt-2 border-t border-base-content/10 text-xs text-base-content/60">
                <span>Muestras: {{ trendResult.n_samples }}</span>
              </div>
            </div>
          </div>

          <div v-if="trendResult.fair_value" class="card bg-base-200 shadow-sm">
            <div class="card-body p-4">
              <h4 class="card-title text-sm flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <ArrowsRightLeftIcon class="w-5 h-5 text-accent" />
                  Fair Value
                </span>
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
                  <p class="font-mono text-sm">
                    ${{ trendResult.fair_value.buy_range.min }} - ${{ trendResult.fair_value.buy_range.max }}
                  </p>
                </div>
                <div class="bg-error/10 border border-error/30 rounded-lg p-2">
                  <p class="text-[10px] text-error font-semibold uppercase">Zona de Venta</p>
                  <p class="font-mono text-sm">
                    ${{ trendResult.fair_value.sell_range.min }} - ${{ trendResult.fair_value.sell_range.max }}
                  </p>
                </div>
              </div>

              <div class="mt-2 grid grid-cols-4 gap-1 text-[10px]">
                <div class="text-center p-1 bg-base-300 rounded">
                  <p class="text-base-content/60">EMA20</p>
                  <p class="font-mono">${{ trendResult.fair_value.ema20 }}</p>
                </div>
                <div class="text-center p-1 bg-base-300 rounded">
                  <p class="text-base-content/60">EMA50</p>
                  <p class="font-mono">${{ trendResult.fair_value.ema50 }}</p>
                </div>
                <div class="text-center p-1 bg-base-300 rounded">
                  <p class="text-base-content/60">Soporte</p>
                  <p class="font-mono">${{ trendResult.fair_value.support20 }}</p>
                </div>
                <div class="text-center p-1 bg-base-300 rounded">
                  <p class="text-base-content/60">Resistencia</p>
                  <p class="font-mono">${{ trendResult.fair_value.resistance20 }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="trendResult.fair_value?.signals?.signals" class="card bg-base-200 shadow-sm">
          <div class="card-body p-4">
            <h4 class="card-title text-sm flex items-center gap-2 mb-3">
              <ArrowTrendingUpIcon class="w-5 h-5 text-info" />
              Señales de Trading
              <div class="flex gap-1 ml-auto">
                <span class="badge badge-success badge-sm">+{{ trendResult.fair_value.signals.buy_score }}</span>
                <span class="badge badge-error badge-sm">-{{ trendResult.fair_value.signals.sell_score }}</span>
                <span class="badge badge-ghost badge-sm">={{ trendResult.fair_value.signals.neutral_score }}</span>
              </div>
            </h4>

            <div class="overflow-x-auto">
              <table class="table table-xs">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Señal</th>
                    <th>Fuerza</th>
                    <th>Razón</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(signal, idx) in trendResult.fair_value.signals.signals" :key="idx">
                    <td class="font-medium">{{ signal.method }}</td>
                    <td>
                      <span
                        class="badge badge-xs"
                        :class="{
                          'badge-success': signal.signal === 'COMPRA' || signal.signal === 'ALCISTA',
                          'badge-error': signal.signal === 'VENTA' || signal.signal === 'BAJISTA',
                          'badge-ghost': signal.signal === 'NEUTRAL',
                        }"
                      >
                        {{ signal.signal }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="text-xs"
                        :class="{
                          'text-success font-semibold': signal.strength === 'fuerte',
                          'text-warning': signal.strength === 'moderada',
                          'text-base-content/50': signal.strength === 'neutral',
                        }"
                      >
                        {{ signal.strength }}
                      </span>
                    </td>
                    <td class="text-xs text-base-content/70 max-w-xs truncate" :title="signal.reason">
                      {{ signal.reason }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <details v-if="trendResult.fair_value" class="collapse collapse-arrow bg-base-200">
          <summary class="collapse-title text-sm font-medium">
            Ver Fair Values por Método
          </summary>
          <div class="collapse-content">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div class="bg-base-300 rounded-lg p-3">
                <p class="text-xs font-semibold text-base-content/70 mb-2">ATR (Volatilidad)</p>
                <div class="flex justify-between text-sm">
                  <span class="text-success">Compra: ${{ trendResult.fair_value.fair_values.atr.buy }}</span>
                  <span class="text-error">Venta: ${{ trendResult.fair_value.fair_values.atr.sell }}</span>
                </div>
              </div>
              <div class="bg-base-300 rounded-lg p-3">
                <p class="text-xs font-semibold text-base-content/70 mb-2">EMA (Mean Reversion)</p>
                <div class="flex justify-between text-sm">
                  <span class="text-success">Compra: ${{ trendResult.fair_value.fair_values.ema.buy }}</span>
                  <span class="text-error">Venta: ${{ trendResult.fair_value.fair_values.ema.sell }}</span>
                </div>
              </div>
              <div class="bg-base-300 rounded-lg p-3">
                <p class="text-xs font-semibold text-base-content/70 mb-2">Soporte/Resistencia</p>
                <div class="flex justify-between text-sm">
                  <span class="text-success">Compra: ${{ trendResult.fair_value.fair_values.support_resistance.buy }}</span>
                  <span class="text-error">Venta: ${{ trendResult.fair_value.fair_values.support_resistance.sell }}</span>
                </div>
              </div>
            </div>
          </div>
        </details>

        <details class="collapse collapse-arrow bg-base-200">
          <summary class="collapse-title text-sm font-medium">
            Ver Reporte de Clasificación ML
          </summary>
          <div class="collapse-content">
            <pre class="text-xs bg-base-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap mt-2">{{ trendResult.classification_report }}</pre>
          </div>
        </details>
      </div>

      <div class="modal-action pt-2 border-t border-base-content/10">
        <button type="button" class="btn btn-primary btn-sm" @click="goToChart(analyzingSymbol || '')">
          <ChartBarSquareIcon class="w-4 h-4 mr-1" />
          Ver Gráfico
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="closeTrendModal">
          Cerrar
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click.prevent="closeTrendModal">
      <button type="button">Cerrar</button>
    </form>
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
</template>
