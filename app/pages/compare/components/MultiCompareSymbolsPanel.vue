<script setup lang="ts">
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { MultiCompareSymbolDetail } from '../useMultiCompare'

interface EnrichedSymbolItem {
  symbol: string
  detail: MultiCompareSymbolDetail | null
}

const props = defineProps<{
  symbols: string[]
  newSymbol: string
  maxSymbols: number
  enrichedSymbols: EnrichedSymbolItem[]
}>()

const emit = defineEmits<{
  (e: 'update:newSymbol', value: string): void
  (e: 'add-symbol'): void
  (e: 'remove-symbol', symbol: string): void
}>()

const newSymbolModel = computed({
  get: () => props.newSymbol,
  set: (value: string) => emit('update:newSymbol', value),
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="newSymbolModel"
        type="text"
        class="input input-bordered input-xs uppercase w-28 sm:w-32"
        placeholder="Añadir símbolo"
        @keyup.enter.prevent="emit('add-symbol')"
      />
      <span class="text-[0.7rem] text-base-content/60">
        {{ symbols.length }} / {{ maxSymbols }} símbolos
      </span>
    </div>

    <div class="flex flex-wrap gap-2 mt-1">
      <div
        v-for="item in enrichedSymbols"
        :key="item.symbol"
        class="flex items-center justify-between gap-2 border border-base-200 rounded-box px-2 py-1 text-[0.7rem] bg-base-200/40"
      >
        <div class="min-w-[90px] max-w-[140px]">
          <div class="font-semibold">
            {{ item.symbol }}
          </div>
          <div class="text-[0.65rem] text-base-content/70 truncate">
            {{ item.detail?.name ?? '—' }}
          </div>
        </div>
        <div class="flex items-end gap-3">
          <div class="text-right">
            <div class="uppercase text-[0.6rem] text-base-content/60">
              Precio
            </div>
            <div
              v-if="item.detail && item.detail.price != null"
              class="font-mono"
            >
              ${{ item.detail.price.toFixed(2) }}
            </div>
            <div v-else>—</div>
          </div>
          <div class="text-right">
            <div class="uppercase text-[0.6rem] text-base-content/60">
              Vol
            </div>
            <div
              v-if="item.detail && item.detail.volume != null"
              class="font-mono"
            >
              {{ item.detail.volume.toLocaleString('es-ES') }}
            </div>
            <div v-else>—</div>
          </div>
          <div class="text-right">
            <div class="uppercase text-[0.6rem] text-base-content/60">
              Ratio
            </div>
            <div
              v-if="item.detail && item.detail.perfPct != null"
              :class="item.detail.perfPct >= 0 ? 'text-success' : 'text-error'"
              class="font-mono"
            >
              {{ item.detail.perfPct >= 0 ? '+' : '' }}{{ item.detail.perfPct.toFixed(2) }}%
            </div>
            <div v-else>—</div>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle ml-1"
          @click="emit('remove-symbol', item.symbol)"
          title="Quitar símbolo"
        >
          <XMarkIcon class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>
