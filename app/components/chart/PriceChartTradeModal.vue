<script setup lang="ts">
// Modal de orden desde gráfico (migrado de components/PriceChartTradeModal.vue)
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'

type TradeSide = 'buy' | 'sell'
type TradeOrderType = 'market' | 'limit'

const props = defineProps<{
  tradeSymbol: string
  tradePrice: number | null
  tradeTimestamp: string | null
  tradeQty: number
  tradeSide: TradeSide
  tradeOrderType: TradeOrderType
  tradeSubmitting: boolean
  tradeError: string | null
}>()

const emit = defineEmits<{
  (e: 'update:tradeSymbol', value: string): void
  (e: 'update:tradePrice', value: number | null): void
  (e: 'update:tradeQty', value: number): void
  (e: 'update:tradeSide', value: TradeSide): void
  (e: 'update:tradeOrderType', value: TradeOrderType): void
  (e: 'submit'): void
  (e: 'close'): void
}>()

const tradeSymbolModel = computed({
  get: () => props.tradeSymbol,
  set: (value: string) => emit('update:tradeSymbol', value),
})

const tradePriceModel = computed({
  get: () => props.tradePrice,
  set: (value: number | null) => emit('update:tradePrice', value),
})

const tradeQtyModel = computed({
  get: () => props.tradeQty,
  set: (value: number) => emit('update:tradeQty', value),
})

const tradeSideModel = computed({
  get: () => props.tradeSide,
  set: (value: TradeSide) => emit('update:tradeSide', value),
})

const tradeOrderTypeModel = computed({
  get: () => props.tradeOrderType,
  set: (value: TradeOrderType) => emit('update:tradeOrderType', value),
})
</script>

<template>
  <div class="modal-box bg-base-200 max-w-sm">
    <h3 class="font-bold text-lg mb-2">Orden desde gráfico</h3>
    <p class="text-xs text-base-content/70 mb-2">
      {{ props.tradeSymbol }}
      <span v-if="props.tradeTimestamp">
        · {{ new Date(props.tradeTimestamp as string).toLocaleString('es-ES') }}
      </span>
    </p>
    <p class="text-sm mb-4">
      Precio seleccionado:
      <span class="font-semibold">
        {{ props.tradePrice != null ? `$${props.tradePrice.toFixed(2)}` : '—' }}
      </span>
    </p>

    <form class="space-y-3" @submit.prevent="emit('submit')">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Símbolo</span>
        </label>
        <input
          v-model="tradeSymbolModel"
          type="text"
          class="input input-bordered input-sm uppercase"
          required
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Cantidad</span>
        </label>
        <input
          v-model.number="tradeQtyModel"
          type="number"
          min="1"
          class="input input-bordered input-sm"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Tipo</span>
          </label>
          <select v-model="tradeSideModel" class="select select-bordered select-sm">
            <option value="buy">Comprar</option>
            <option value="sell">Vender</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Orden</span>
          </label>
          <select v-model="tradeOrderTypeModel" class="select select-bordered select-sm">
            <option value="market">Mercado</option>
            <option value="limit">Límite</option>
          </select>
        </div>
      </div>

      <div v-if="tradeOrderTypeModel === 'limit'" class="form-control">
        <label class="label">
          <span class="label-text">Precio límite</span>
        </label>
        <input
          v-model.number="tradePriceModel"
          type="number"
          step="0.01"
          min="0"
          class="input input-bordered input-sm"
        />
      </div>

      <div v-if="props.tradeError" class="alert alert-error py-2 text-sm">
        <span>{{ props.tradeError }}</span>
      </div>

      <div class="modal-action mt-4">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="emit('close')"
          :disabled="props.tradeSubmitting"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          Cancelar
        </button>
        <button type="submit" class="btn btn-success btn-sm" :disabled="props.tradeSubmitting">
          <span v-if="props.tradeSubmitting" class="loading loading-spinner loading-xs mr-1" />
          <PaperAirplaneIcon v-else class="w-4 h-4 mr-1" />
          Enviar Orden
        </button>
      </div>
    </form>
  </div>
</template>
