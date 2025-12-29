<script setup lang="ts">
// Página de screener (migrada de views/screener/ScreenerView.vue)
import {
  ArrowPathIcon,
  PlusIcon,
  StarIcon,
  ChartBarSquareIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'
import { useScreener } from './useScreener'

definePageMeta({
  middleware: 'auth',
})

const {
  loading,
  error,
  mode,
  market,
  exchange,
  by,
  limit,
  minPrice,
  maxPrice,
  sortBy,
  sortDir,
  favorites,
  loadingFavorites,
  updatingFavorites,
  newFavoriteSymbol,
  showOnlyFavorites,
  favoritesError,
  isStocks,
  filteredMostActives,
  filteredGainers,
  filteredLosers,
  movers,
  mostActives,
  isFavorite,
  goToChart,
  toggleFavorite,
  addFavoriteFromInput,
  loadData,
} = useScreener()
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

        <select v-if="isStocks" v-model="exchange" class="select select-sm select-bordered" @change="loadData">
          <option :value="null">Todos los Exchange</option>
          <option value="NASDAQ">NASDAQ</option>
          <option value="NYSE">NYSE</option>
          <option value="AMEX">AMEX</option>
          <option value="ARCA">ARCA</option>
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
          <option :value="100">Top 100</option>
        </select>

        <select v-model="sortBy" class="select select-sm select-bordered">
          <option value="price">Ordenar por precio</option>
          <option v-if="mode === 'most-actives'" value="volume">Ordenar por volumen</option>
        </select>

        <select v-model="sortDir" class="select select-sm select-bordered">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <div class="flex items-center gap-1 text-xs">
          <label class="flex items-center gap-1">
            <span>Precio mín:</span>
            <input
              v-model.number="minPrice"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
              @blur="loadData"
            />
          </label>
          <label class="flex items-center gap-1">
            <span>máx:</span>
            <input
              v-model.number="maxPrice"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
              @blur="loadData"
            />
          </label>
        </div>

        <button type="button" class="btn btn-sm btn-outline" @click="loadData">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
        </button>
      </div>
    </header>

    <!-- Favoritos -->
    <section v-if="favorites.length || favoritesError" class="card bg-base-300 shadow-sm">
      <div class="card-body py-3 space-y-2">
        <div class="flex flex-wrap items-center gap-2 justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold">Favoritos:</span>
            <span v-if="loadingFavorites" class="loading loading-spinner loading-xs" />
            <span v-else-if="!favorites.length" class="text-xs text-base-content/70">
              No tienes símbolos favoritos configurados.
            </span>
          </div>
          <label v-if="favorites.length" class="flex items-center gap-1 text-xs cursor-pointer select-none">
            <input v-model="showOnlyFavorites" type="checkbox" class="checkbox checkbox-xs" />
            <span>Mostrar solo favoritos en tablas</span>
          </label>
        </div>

        <div v-if="favoritesError" class="alert alert-error py-1 text-xs">
          <span>{{ favoritesError }}</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="newFavoriteSymbol"
            type="text"
            placeholder="Agregar símbolo (ej: AAPL)"
            class="input input-xs input-bordered w-32 sm:w-40"
            @keyup.enter="addFavoriteFromInput"
          />
          <button
            type="button"
            class="btn btn-xs btn-primary"
            :disabled="updatingFavorites || !newFavoriteSymbol"
            @click="addFavoriteFromInput"
          >
            <PlusIcon class="w-3 h-3 mr-1" />
            Agregar
          </button>
        </div>

        <div v-if="favorites.length" class="flex flex-wrap gap-1">
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
                <th>Exchange</th>
                <th>Nombre</th>
                <th class="text-right">Precio</th>
                <th class="text-right">Cierre</th>
                <th class="text-right">Volumen</th>
                <th class="text-right"># Trades</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in filteredMostActives"
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
                    title="Agregar/quitar de favoritos"
                  >
                    <StarIconSolid v-if="isFavorite(item.symbol)" class="w-4 h-4 text-warning" />
                    <StarIcon v-else class="w-4 h-4" />
                  </button>
                  <span class="ml-1">{{ item.symbol }}</span>
                </td>
                <td class="text-xs opacity-70">{{ item.exchange }}</td>
                <td>{{ item.name }}</td>
                <td class="text-right">
                  {{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}
                </td>
                <td class="text-right">
                  {{ item.close != null ? `$${item.close.toFixed(2)}` : '-' }}
                </td>
                <td class="text-right">
                  {{ item.volume?.toLocaleString('es-ES') ?? '-' }}
                </td>
                <td class="text-right">
                  {{ item.trade_count?.toLocaleString('es-ES') ?? '-' }}
                </td>
                <td class="text-right">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    @click="goToChart(item.symbol)"
                    title="Ver gráfico"
                  >
                    <ChartBarSquareIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredMostActives.length">
                <td colspan="8" class="text-center py-4 text-sm text-base-content/70">
                  No hay datos disponibles.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="mostActives.length" class="card-footer text-xs text-base-content/70 flex justify-between px-4 py-2">
          <span>Mercado: {{ isStocks ? 'Acciones' : 'Crypto' }}</span>
          <span>Última actualización: {{ filteredMostActives[0]?.last_updated || 'N/D' }}</span>
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
                  <th>Exchange</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cierre</th>
                  <th class="text-right">Cambio</th>
                  <th class="text-right">Cambio %</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in filteredGainers"
                  :key="`g-${item.symbol ?? idx}`"
                  :class="isFavorite(item.symbol) ? 'bg-base-200/70' : ''"
                >
                  <td>{{ idx + 1 }}</td>
                  <td class="font-mono">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs px-1"
                      :disabled="updatingFavorites"
                      @click="toggleFavorite(item.symbol)"
                      title="Agregar/quitar de favoritos"
                    >
                      <StarIconSolid v-if="isFavorite(item.symbol)" class="w-4 h-4 text-warning" />
                      <StarIcon v-else class="w-4 h-4" />
                    </button>
                    <span class="ml-1">{{ item.symbol }}</span>
                  </td>
                  <td class="text-[10px] opacity-60">{{ item.exchange || '-' }}</td>
                  <td class="text-right">{{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}</td>
                  <td class="text-right">{{ item.close != null ? `$${item.close.toFixed(2)}` : '-' }}</td>
                  <td class="text-right">{{ item.change != null ? `$${item.change.toFixed(2)}` : '-' }}</td>
                  <td class="text-right text-success">
                    {{ item.percent_change != null ? `${item.percent_change.toFixed(2)}%` : '-' }}
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-ghost btn-xs" @click="goToChart(item.symbol)" title="Ver gráfico">
                      <ChartBarSquareIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!filteredGainers.length">
                  <td colspan="7" class="text-center py-4 text-sm text-base-content/70">No hay datos de ganadoras.</td>
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
                  <th>Exchange</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cierre</th>
                  <th class="text-right">Cambio</th>
                  <th class="text-right">Cambio %</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in filteredLosers"
                  :key="`l-${item.symbol ?? idx}`"
                  :class="isFavorite(item.symbol) ? 'bg-base-200/70' : ''"
                >
                  <td>{{ idx + 1 }}</td>
                  <td class="font-mono">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs px-1"
                      :disabled="updatingFavorites"
                      @click="toggleFavorite(item.symbol)"
                      title="Agregar/quitar de favoritos"
                    >
                      <StarIconSolid v-if="isFavorite(item.symbol)" class="w-4 h-4 text-warning" />
                      <StarIcon v-else class="w-4 h-4" />
                    </button>
                    <span class="ml-1">{{ item.symbol }}</span>
                  </td>
                  <td class="text-[10px] opacity-60">{{ item.exchange || '-' }}</td>
                  <td class="text-right">{{ item.price != null ? `$${item.price.toFixed(2)}` : '-' }}</td>
                  <td class="text-right">{{ item.close != null ? `$${item.close.toFixed(2)}` : '-' }}</td>
                  <td class="text-right">{{ item.change != null ? `$${item.change.toFixed(2)}` : '-' }}</td>
                  <td class="text-right text-error">
                    {{ item.percent_change != null ? `${item.percent_change.toFixed(2)}%` : '-' }}
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-ghost btn-xs" @click="goToChart(item.symbol)" title="Ver gráfico">
                      <ChartBarSquareIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!filteredLosers.length">
                  <td colspan="7" class="text-center py-4 text-sm text-base-content/70">No hay datos de perdedoras.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="movers" class="md:col-span-2 text-xs text-base-content/70 flex justify-between mt-1">
          <span>Mercado: {{ isStocks ? 'Acciones' : 'Crypto' }}</span>
          <span>Última actualización: {{ movers.last_updated || 'N/D' }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
