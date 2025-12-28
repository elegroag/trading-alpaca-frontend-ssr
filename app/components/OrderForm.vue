<script setup lang="ts">
// Componente de formulario de orden (migrado de components/OrderForm.vue)
import { PlusIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import type { CreateOrderPayload } from '~/composables/useApi'

const { TradingAPI } = useApi()

const modalRef = ref<HTMLDialogElement | null>(null)
const submitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const form = reactive({
  symbol: '',
  qty: 1,
  notional: null as number | null,
  amount_type: 'qty' as 'qty' | 'notional',
  side: 'buy' as 'buy' | 'sell',
  order_type: 'market' as 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' | 'bracket',
  limit_price: null as number | null,
  stop_price: null as number | null,
  trail_price: null as number | null,
  trail_percent: null as number | null,
  take_profit: { limit_price: 0 } as { limit_price: number },
  stop_loss: { stop_price: 0 } as { stop_price: number; limit_price?: number },
})

const showQty = computed(() => form.amount_type === 'qty')
const showNotional = computed(() => form.amount_type === 'notional')
const canUseNotional = computed(() => ['market', 'limit'].includes(form.order_type))

const showLimitPrice = computed(() => ['limit', 'stop_limit', 'bracket'].includes(form.order_type))
const showStopPrice = computed(() => ['stop', 'stop_limit', 'bracket'].includes(form.order_type))
const showTrailPrice = computed(() => form.order_type === 'trailing_stop')
const showTrailPercent = computed(() => form.order_type === 'trailing_stop')
const showBracketOptions = computed(() => form.order_type === 'bracket')

const orderDescriptions = {
  market: 'Ejecución inmediata al mejor precio disponible del mercado.',
  limit: 'Ejecución solo al precio especificado o mejor. Control total del precio.',
  stop: 'Se convierte en orden de mercado al alcanzar el precio de stop.',
  stop_limit: 'Se convierte en orden límite al alcanzar el precio de stop.',
  trailing_stop: 'Stop dinámico que se ajusta automáticamente con el movimiento del precio.',
  bracket: 'Orden con take profit y stop loss automáticos para gestionar riesgos.',
}

const currentOrderDescription = computed(() => orderDescriptions[form.order_type])

const emit = defineEmits<{
  (e: 'order-created'): void
}>()

const resetForm = () => {
  form.symbol = ''
  form.qty = 1
  form.notional = null
  form.amount_type = 'qty'
  form.side = 'buy'
  form.order_type = 'market'
  form.limit_price = null
  form.stop_price = null
  form.trail_price = null
  form.trail_percent = null
  form.take_profit = { limit_price: 0 }
  form.stop_loss = { stop_price: 0 }
  error.value = null
  successMessage.value = null
}

const openModal = () => {
  resetForm()
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

  if (form.amount_type === 'qty') {
    if (!form.qty || form.qty <= 0) {
      error.value = 'La cantidad debe ser mayor a 0.'
      return
    }
  } else {
    if (!form.notional || form.notional <= 0) {
      error.value = 'El monto en dólares debe ser mayor a 0.'
      return
    }
  }

  // Validaciones adicionales según tipo de orden
  if (form.order_type === 'limit' && (!form.limit_price || form.limit_price <= 0)) {
    error.value = 'El precio límite debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'stop' && (!form.stop_price || form.stop_price <= 0)) {
    error.value = 'El precio de stop debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'stop_limit' && (!form.stop_price || form.stop_price <= 0)) {
    error.value = 'El precio de stop debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'stop_limit' && (!form.limit_price || form.limit_price <= 0)) {
    error.value = 'El precio límite debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'trailing_stop' && !form.trail_price && !form.trail_percent) {
    error.value = 'Debe especificar trail_price o trail_percent para trailing stop.'
    return
  }

  if (form.order_type === 'bracket' && (!form.limit_price || form.limit_price <= 0)) {
    error.value = 'El precio límite debe ser mayor a 0 para bracket orders.'
    return
  }

  if (form.order_type === 'bracket' && (!form.take_profit?.limit_price || form.take_profit.limit_price <= 0)) {
    error.value = 'El precio de take profit debe ser mayor a 0.'
    return
  }

  if (form.order_type === 'bracket' && (!form.stop_loss?.stop_price || form.stop_loss.stop_price <= 0)) {
    error.value = 'El precio de stop loss debe ser mayor a 0.'
    return
  }

  // Validar lógica de precios para bracket orders
  if (form.order_type === 'bracket' && form.limit_price) {
    const tpPrice = form.take_profit?.limit_price || 0
    const slPrice = form.stop_loss?.stop_price || 0
    
    if (form.side === 'buy') {
      // Para compra: SL < entrada < TP
      if (slPrice >= form.limit_price) {
        error.value = `Para compra, stop loss (${slPrice}) debe ser menor al precio de entrada (${form.limit_price}).`
        return
      }
      
      if (tpPrice <= form.limit_price) {
        error.value = `Para compra, take profit (${tpPrice}) debe ser mayor al precio de entrada (${form.limit_price}).`
        return
      }
    } else {
      // Para venta: TP < entrada < SL
      if (tpPrice >= form.limit_price) {
        error.value = `Para venta, take profit (${tpPrice}) debe ser menor al precio de entrada (${form.limit_price}).`
        return
      }
      
      if (slPrice <= form.limit_price) {
        error.value = `Para venta, stop loss (${slPrice}) debe ser mayor al precio de entrada (${form.limit_price}).`
        return
      }
    }
  }

  const payload: CreateOrderPayload = {
    symbol,
    side: form.side,
    order_type: form.order_type,
  }

  if (form.amount_type === 'qty') {
    payload.qty = form.qty
  } else {
    payload.notional = form.notional ?? undefined
  }

  // Agregar parámetros según tipo de orden
  if (form.order_type === 'limit' && form.limit_price) {
    payload.limit_price = form.limit_price
  }

  if (form.order_type === 'stop' && form.stop_price) {
    payload.stop_price = form.stop_price
  }

  if (form.order_type === 'stop_limit') {
    if (form.stop_price) payload.stop_price = form.stop_price
    if (form.limit_price) payload.limit_price = form.limit_price
  }

  if (form.order_type === 'trailing_stop') {
    if (form.trail_price && form.trail_percent) {
      error.value = 'Solo puedes especificar trail_price o trail_percent, no ambos.'
      return
    }
    if (!form.trail_price && !form.trail_percent) {
      error.value = 'Debes especificar trail_price o trail_percent para trailing stop.'
      return
    }
    if (form.trail_price) payload.trail_price = form.trail_price
    if (form.trail_percent) payload.trail_percent = form.trail_percent
  }

  if (form.order_type === 'bracket') {
    if (form.limit_price) payload.limit_price = form.limit_price
    if (form.take_profit) payload.take_profit = form.take_profit
    if (form.stop_loss) payload.stop_loss = form.stop_loss
  }

  submitting.value = true
  try {
    const response = await TradingAPI.createOrder(payload)
    if (!response.success) {
      throw new Error(response.error ?? 'Error al crear orden')
    }
    
    // Mostrar mensaje de éxito
    if (response.success && response.message) {
      successMessage.value = response.message
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        closeModal()
        emit('order-created')
      }, 2000)
    } else {
      emit('order-created')
      closeModal()
    }
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

          <div class="form-control" v-if="canUseNotional">
            <label class="label">
              <span class="label-text">Tipo de Cantidad</span>
            </label>
            <div class="flex gap-4 px-1">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="form.amount_type"
                  type="radio"
                  value="qty"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm">Cantidad (qty)</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  v-model="form.amount_type"
                  type="radio"
                  value="notional"
                  class="radio radio-sm radio-primary"
                />
                <span class="text-sm">Fraccional (notional)</span>
              </label>
            </div>
          </div>

          <div class="form-control" v-if="showQty">
            <label class="label">
              <span class="label-text">Cantidad (Acciones)</span>
            </label>
            <input
              v-model.number="form.qty"
              type="number"
              min="0.000000001"
              step="any"
              class="input input-bordered input-sm"
              placeholder="10"
              :required="showQty"
            />
          </div>

          <div class="form-control" v-if="showNotional">
            <label class="label">
              <span class="label-text">Monto ($ USD)</span>
            </label>
            <input
              v-model.number="form.notional"
              type="number"
              min="1"
              step="0.01"
              class="input input-bordered input-sm"
              placeholder="100.00"
              :required="showNotional"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Tipo</span>
              </label>
              <div class="space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.side"
                    type="radio"
                    value="buy"
                    class="radio radio-sm radio-success"
                  />
                  <span class="text-sm">Comprar</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.side"
                    type="radio"
                    value="sell"
                    class="radio radio-sm radio-error"
                  />
                  <span class="text-sm">Vender</span>
                </label>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Orden</span>
              </label>
              <div class="space-y-2">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="market"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Mercado</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="limit"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Límite</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="stop"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Stop</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="stop_limit"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Stop Límite</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="trailing_stop"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Trailing Stop</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    v-model="form.order_type"
                    type="radio"
                    value="bracket"
                    class="radio radio-sm radio-primary"
                  />
                  <span class="text-sm">Bracket</span>
                </label>
              </div>
              <div class="mt-2">
                <span class="text-xs text-base-content/60">{{ currentOrderDescription }}</span>
              </div>
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

          <div v-if="showStopPrice" class="form-control">
            <label class="label">
              <span class="label-text">Precio de stop</span>
            </label>
            <input
              v-model.number="form.stop_price"
              type="number"
              step="0.01"
              min="0"
              class="input input-bordered input-sm"
              placeholder="145.00"
            />
          </div>

          <div v-if="showTrailPrice" class="form-control">
            <label class="label">
              <span class="label-text">Trail price ($)</span>
            </label>
            <input
              v-model.number="form.trail_price"
              type="number"
              step="0.01"
              min="0"
              class="input input-bordered input-sm"
              placeholder="2.00"
            />
          </div>

          <div v-if="showTrailPercent" class="form-control">
            <label class="label">
              <span class="label-text">Trail percent (%)</span>
            </label>
            <input
              v-model.number="form.trail_percent"
              type="number"
              step="0.1"
              min="0"
              class="input input-bordered input-sm"
              placeholder="5.0"
            />
          </div>

          <div v-if="showBracketOptions" class="space-y-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Take Profit</span>
              </label>
              <input
                v-model.number="form.take_profit.limit_price"
                type="number"
                step="0.01"
                min="0"
                class="input input-bordered input-sm"
                placeholder="160.00"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Stop Loss</span>
              </label>
              <input
                v-model.number="form.stop_loss.stop_price"
                type="number"
                step="0.01"
                min="0"
                class="input input-bordered input-sm"
                placeholder="140.00"
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-error py-2 text-sm">
            <span>{{ error }}</span>
          </div>

          <div v-if="successMessage" class="alert alert-success py-2 text-sm">
            <span class="text-sm font-semibold text-success">{{ successMessage }}</span>
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
