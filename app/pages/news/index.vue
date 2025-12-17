<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { useNews } from './useNews'

definePageMeta({
  middleware: 'auth',
})

const {
  loadingPositions,
  loadingNews,
  error,
  sortedPositions,
  selectedSymbol,
  news,
  limit,
  refresh,
} = useNews()
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Noticias (Scraping)</h1>
        <p class="text-xs text-base-content/70">
          Selecciona un símbolo de tus posiciones abiertas y consulta noticias scrapeadas.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <div class="join join-sm">
          <select
            v-if="sortedPositions.length"
            v-model="selectedSymbol"
            class="select select-sm select-bordered join-item min-w-[180px]"
            :disabled="loadingPositions"
          >
            <option value="" disabled>Seleccionar símbolo</option>
            <option v-for="p in sortedPositions" :key="p.symbol" :value="p.symbol">
              {{ p.symbol }} (qty: {{ p.qty }})
            </option>
          </select>

          <input
            v-else
            v-model="selectedSymbol"
            type="text"
            placeholder="Símbolo (ej: AAPL)"
            class="input input-sm input-bordered join-item min-w-[180px]"
            :disabled="loadingPositions"
          />

          <input
            v-model.number="limit"
            type="number"
            min="1"
            max="50"
            class="input input-sm input-bordered join-item w-20"
            title="Límite"
          />

          <button type="button" class="btn btn-sm btn-outline join-item" @click="refresh">
            <span v-if="loadingPositions || loadingNews" class="loading loading-spinner loading-xs mr-1" />
            <ArrowPathIcon v-else class="w-4 h-4 mr-1" />
            Recargar
          </button>
        </div>
      </div>
    </header>

    <div v-if="error" class="alert alert-error py-2 text-sm">
      <span>{{ error }}</span>
    </div>

    <div v-if="loadingPositions" class="card bg-base-300 shadow-md">
      <div class="card-body flex justify-center py-4">
        <span class="loading loading-spinner" />
      </div>
    </div>

    <div v-else-if="sortedPositions.length === 0 && !selectedSymbol" class="card bg-base-300 shadow-md">
      <div class="card-body">
        <p class="text-sm text-base-content/70">No tienes posiciones abiertas para seleccionar.</p>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Resultados: {{ selectedSymbol || '—' }}</h2>
        <span v-if="loadingNews" class="loading loading-spinner loading-sm" />
      </div>

      <div v-if="!loadingNews && news.length === 0" class="text-sm text-base-content/70">
        No hay noticias disponibles para este símbolo.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <article
          v-for="item in news"
          :key="(item.url || item.title) + (item.date || '')"
          class="card bg-base-200 border border-base-300 shadow-sm"
        >
          <div class="card-body p-4 gap-2">
            <h3 class="font-semibold leading-snug">{{ item.title }}</h3>

            <div class="text-xs text-base-content/60 flex items-center gap-2 flex-wrap">
              <span v-if="item.publisher">{{ item.publisher }}</span>
              <span v-if="item.publisher && item.date">·</span>
              <span v-if="item.date">{{ item.date }}</span>
            </div>

            <div class="card-actions justify-end">
              <a
                v-if="item.url"
                class="btn btn-sm btn-primary"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir
              </a>
              <button v-else type="button" class="btn btn-sm btn-disabled">Sin link</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
