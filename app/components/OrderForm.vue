<script setup lang="ts">
// Componente de formulario de orden (migrado de components/OrderForm.vue)
import { PlusIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { CreateOrderPayload } from '~/composables/useApi'

const { TradingAPI } = useApi()

const modalRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  symbol: '',
  qty: 1,
  side: 'buy' as 'buy' | 'sell',
  order_type: 'market' as 'market' | 'limit',
  limit_price: null as number | null,
})

const showLimitPrice = computed(() => form.order_type === 'limit')

const emit = defineEmits<{
  (e: 'order-created'): void
}>()

const resetForm = () => {
  form.symbol = ''
  form.qty = 1
  form.side = 'buy'
  form.order_type = 'market'
  form.limit_price = null
}

const openModal = () => {
  resetForm()
  error.value = null
  if (modalRef.value) {
    modalRef.value.showModal()
  }
}

const closeModal = () => {
  if (!submitting.value && modalRef.value) {
    modalRef.value.close()
  }
}

const submitOrder = async () => {
  error.value = null

  const symbol = form.symbol.trim().toUpperCase()
  if (!symbol) {
    error.value = 'El símbolo es obligatorio.'
    return
  }

  if (!form.qty || form.qty <= 0) {
    error.value = 'La cantidad debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'limit' && (!form.limit_price || form.limit_price <= 0)) {
    error.value = 'El precio límite debe ser mayor a 0.'
    return
  }

  const payload: CreateOrderPayload = {
    symbol,
    qty: form.qty,
    side: form.side,
    order_type: form.order_type,
  }

  if (form.order_type === 'limit' && form.limit_price) {
    payload.limit_price = form.limit_price
  }

  submitting.value = true
  try {
    const response = await TradingAPI.createOrder(payload)
    if (!response.success) {
      throw new Error(response.error ?? 'Error al crear orden')
    }
    emit('order-created')
    closeModal()
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Error inesperado al crear la orden'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button type="button" class="btn btn-primary btn-sm" @click="openModal">
      <PlusIcon class="w-4 h-4 mr-1" />
      Nueva Orden
    </button>

    <dialog ref="modalRef" class="modal">
      <div class="modal-box bg-base-200">
        <h3 class="font-bold text-lg mb-4">Nueva Orden</h3>

        <form class="space-y-3" @submit.prevent="submitOrder">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Símbolo</span>
            </label>
            <input
              v-model="form.symbol"
              type="text"
              class="input input-bordered input-sm uppercase"
              placeholder="AAPL"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Cantidad</span>
            </label>
            <input
              v-model.number="form.qty"
              type="number"
              min="1"
              class="input input-bordered input-sm"
              placeholder="10"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Tipo</span>
              </label>
              <select v-model="form.side" class="select select-bordered select-sm">
                <option value="buy">Comprar</option>
                <option value="sell">Vender</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Orden</span>
              </label>
              <select v-model="form.order_type" class="select select-bordered select-sm">
                <option value="market">Mercado</option>
                <option value="limit">Límite</option>
              </select>
            </div>
          </div>

          <div v-if="showLimitPrice" class="form-control">
            <label class="label">
              <span class="label-text">Precio límite</span>
            </label>
            <input
              v-model.number="form.limit_price"
              type="number"
              step="0.01"
              min="0"
              class="input input-bordered input-sm"
              placeholder="150.00"
            />
          </div>

          <div v-if="error" class="alert alert-error py-2 text-sm">
            <span>{{ error }}</span>
          </div>

          <div class="modal-action mt-4">
            <button type="button" class="btn btn-ghost btn-sm" @click="closeModal" :disabled="submitting">
              <XMarkIcon class="w-4 h-4 mr-1" />
              Cancelar
            </button>
            <button type="submit" class="btn btn-success btn-sm" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-xs mr-1" />
              <PaperAirplaneIcon v-else class="w-4 h-4 mr-1" />
              Enviar Orden
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop mt-1 text-gray-400">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
