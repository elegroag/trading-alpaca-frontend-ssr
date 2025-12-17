<script setup lang="ts">
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline'
import { useMarketSymbols } from './useMarketSymbols'

definePageMeta({
  middleware: 'auth',
})

const {
  loading,
  error,
  symbols,
  search,
  marketFilter,
  directionFilter,
  minPriceFilter,
  maxPriceFilter,
  minPctFilter,
  maxPctFilter,
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  paginatedSymbols,
  goToPage,
  loadSymbols,
} = useMarketSymbols()
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Símbolos de mercado (Mongo)</h1>
        <p class="text-xs text-base-content/70">
          Listado de símbolos sincronizados desde Alpaca Screener API y almacenados en MongoDB.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <div class="join join-sm">
          <input
            v-model="search"
            type="text"
            placeholder="Buscar símbolo o nombre"
            class="input input-sm input-bordered join-item"
          />
          <select
            v-model="marketFilter"
            class="select select-sm select-bordered join-item max-w-[120px]"
          >
            <option value="all">Todos mercados</option>
            <option value="stocks">Acciones</option>
            <option value="crypto">Crypto</option>
          </select>
          <select
            v-model="directionFilter"
            class="select select-sm select-bordered join-item max-w-[120px]"
          >
            <option value="all">Todas direcciones</option>
            <option value="gainer">Ganadoras</option>
            <option value="loser">Perdedoras</option>
          </select>
        </div>

        <div class="flex items-center gap-2 text-xs flex-wrap">
          <label class="flex items-center gap-1">
            <span>Precio mín:</span>
            <input
              v-model.number="minPriceFilter"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
            />
          </label>
          <label class="flex items-center gap-1">
            <span>máx:</span>
            <input
              v-model.number="maxPriceFilter"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
            />
          </label>
          <label class="flex items-center gap-1">
            <span>% mín:</span>
            <input
              v-model.number="minPctFilter"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
            />
          </label>
          <label class="flex items-center gap-1">
            <span>máx:</span>
            <input
              v-model.number="maxPctFilter"
              type="number"
              step="0.01"
              class="input input-xs input-bordered w-20"
            />
          </label>
        </div>

        <button type="button" class="btn btn-sm btn-outline" @click="loadSymbols">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          Recargar
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
        <div class="alert alert-error py-2 text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <div v-else class="card bg-base-300 shadow-md">
      <div class="card-body p-0 overflow-x-auto">
        <div class="flex items-center justify-between px-4 pt-3 pb-1 text-xs">
          <div>
            <span class="font-semibold">Total símbolos:</span>
            <span class="ml-1">{{ totalItems }}</span>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-1">
              <span>Por página:</span>
              <select v-model.number="pageSize" class="select select-xs select-bordered">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </label>
            <div class="join join-xs">
              <button
                type="button"
                class="btn btn-xs join-item"
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
              >
                <ChevronLeftIcon class="w-3 h-3" />
              </button>
              <button type="button" class="btn btn-xs join-item pointer-events-none">
                Página {{ page }} / {{ totalPages }}
              </button>
              <button
                type="button"
                class="btn btn-xs join-item"
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
              >
                <ChevronRightIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <table class="table table-zebra table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Símbolo</th>
              <th>Nombre</th>
              <th class="text-right">Mercado</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Cierre</th>
              <th class="text-right">Cambio</th>
              <th class="text-right">Cambio %</th>
              <th class="text-right">Dirección</th>
              <th class="text-right">Volumen</th>
              <th class="text-right"># Trades</th>
              <th class="text-right">Últ. Screener</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in paginatedSymbols" :key="item.id ?? item.symbol ?? idx">
              <td>{{ (page - 1) * pageSize + idx + 1 }}</td>
              <td class="font-mono">{{ item.symbol }}</td>
              <td>{{ item.name }}</td>
              <td class="text-right">{{ item.market ?? '-' }}</td>
              <td class="text-right">{{ item.price != null ? item.price.toFixed(2) : '-' }}</td>
              <td class="text-right">{{ item.close != null ? item.close.toFixed(2) : '-' }}</td>
              <td class="text-right">{{ item.change != null ? item.change.toFixed(2) : '-' }}</td>
              <td class="text-right">
                {{ item.percent_change != null ? item.percent_change.toFixed(2) + ' %' : '-' }}
              </td>
              <td class="text-right">{{ item.direction ?? '-' }}</td>
              <td class="text-right">
                {{ item.volume != null ? item.volume.toLocaleString('es-ES') : '-' }}
              </td>
              <td class="text-right">
                {{ item.trade_count != null ? item.trade_count.toLocaleString('es-ES') : '-' }}
              </td>
              <td class="text-right text-[11px]">
                {{ item.last_screener_timestamp ?? '-' }}
              </td>
            </tr>
            <tr v-if="!symbols.length">
              <td colspan="12" class="text-center py-4 text-sm text-base-content/70">
                No hay símbolos sincronizados. Ejecuta la sincronización desde el Dashboard.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
