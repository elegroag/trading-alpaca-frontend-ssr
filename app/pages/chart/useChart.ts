import type { Bar } from '~/composables/useApi'
import type { PriceChartOpportunity, PriceChartValuationBaseSma } from './chart.utils'
import { rangeSteps } from './chart.utils'

export type DrawingMode = 'none' | 'support' | 'resistance' | 'trend'

export interface PositionData {
    symbol: string
    qty: number
    avg_entry_price: number
    current_price: number
    market_value: number
    unrealized_pl: number
    unrealized_plpc: number
    side: string
}

export function useChart() {
    const route = useRoute()
    const { TradingAPI } = useApi()
    const wsClient = useSocket()

    const symbol = ref((route.query.symbol as string)?.toUpperCase() || 'AAPL')
    const timeframe = ref('1D')
    const loading = ref(false)
    const error = ref<string | null>(null)

    const bars = ref<Bar[]>([])
    const currentSymbol = ref<string | null>(null)
    const currentPrice = ref<number | null>(null)
    const closePrice = ref<number | null>(null)
    const companyName = ref<string | null>(null)
    const wsConnected = ref(false)
    const currentPosition = ref<PositionData | null>(null)

    const isFullscreen = ref(false)
    const drawingMode = ref<DrawingMode>('none')
    const opportunities = ref<PriceChartOpportunity[]>([])

    const valuationRulesEnabled = ref(true)
    const valuationBaseSma = ref<PriceChartValuationBaseSma>('sma20')
    const valuationOverPct = ref(3)
    const valuationUnderPct = ref(3)

    const effectiveOverPct = computed(() => {
        const base = valuationOverPct.value
        if (timeframe.value === '1Min') {
            return Math.max(0.5, base / 3)
        }
        if (timeframe.value === '5Min') {
            return Math.max(0.75, base / 2)
        }
        return base
    })

    const effectiveUnderPct = computed(() => {
        const base = valuationUnderPct.value
        if (timeframe.value === '1Min') {
            return Math.max(0.5, base / 3)
        }
        if (timeframe.value === '5Min') {
            return Math.max(0.75, base / 2)
        }
        return base
    })

    const xTicksLimit = ref(10)
    const rangeIndex = ref(0)

    const currentMultiplier = computed(() => {
        const idx = rangeIndex.value
        if (idx < 0 || idx >= rangeSteps.length) return rangeSteps[0]!
        return rangeSteps[idx]!
    })

    const currentLimit = computed(() => currentMultiplier.value * 10)

    // Trade modal
    const tradeModalRef = ref<HTMLDialogElement | null>(null)
    const tradeSymbol = ref('')
    const tradePrice = ref<number | null>(null)
    const tradeTimestamp = ref<string | null>(null)
    const tradeQty = ref(1)
    const tradeSide = ref<'buy' | 'sell'>('buy')
    const tradeOrderType = ref<'market' | 'limit'>('limit')
    const tradeSubmitting = ref(false)
    const tradeError = ref<string | null>(null)

    // Toast
    const toastMessage = ref<string | null>(null)
    const toastType = ref<'info' | 'success' | 'error'>('info')
    let toastTimeout: ReturnType<typeof setTimeout> | null = null

    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        toastMessage.value = message
        toastType.value = type
        if (toastTimeout !== null) clearTimeout(toastTimeout)
        toastTimeout = setTimeout(() => {
            toastMessage.value = null
            toastTimeout = null
        }, 4000)
    }

    const setDrawingMode = (mode: DrawingMode) => {
        drawingMode.value = drawingMode.value === mode ? 'none' : mode
    }

    const toggleFullscreen = () => {
        isFullscreen.value = !isFullscreen.value
    }

    const openTradeModalForBar = (index: number) => {
        const sortedBars = [...bars.value].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        const bar = sortedBars[index]
        if (!bar) return

        tradeSymbol.value = symbol.value.trim().toUpperCase()
        tradePrice.value = bar.close
        tradeTimestamp.value = bar.timestamp
        tradeQty.value = 1
        tradeSide.value = 'buy'
        tradeOrderType.value = 'limit'
        tradeError.value = null

        if (tradeModalRef.value) {
            tradeModalRef.value.showModal()
        }
    }

    const closeTradeModal = () => {
        if (tradeModalRef.value) {
            tradeModalRef.value.close()
        }
    }

    const submitTradeFromChart = async () => {
        tradeError.value = null

        const symbolValue = tradeSymbol.value.trim().toUpperCase()
        if (!symbolValue) {
            tradeError.value = 'El símbolo es obligatorio.'
            return
        }

        if (!tradeQty.value || tradeQty.value <= 0) {
            tradeError.value = 'La cantidad debe ser mayor a 0.'
            return
        }

        if (tradeOrderType.value === 'limit' && (!tradePrice.value || tradePrice.value <= 0)) {
            tradeError.value = 'El precio límite debe ser mayor a 0.'
            return
        }

        const payload: Record<string, unknown> = {
            symbol: symbolValue,
            qty: tradeQty.value,
            side: tradeSide.value,
            order_type: tradeOrderType.value,
        }

        if (tradeOrderType.value === 'limit' && tradePrice.value) {
            payload.limit_price = tradePrice.value
        }

        tradeSubmitting.value = true
        try {
            const response = await TradingAPI.createOrder(payload as any)
            if (!response.success) {
                throw new Error(response.error ?? 'Error al crear orden')
            }
            closeTradeModal()
            showToast('Orden creada correctamente.', 'success')
        } catch (e: unknown) {
            const msg = (e as Error)?.message ?? 'Error inesperado al crear la orden'
            tradeError.value = msg
            showToast(msg, 'error')
        } finally {
            tradeSubmitting.value = false
        }
    }

    const applyQuoteData = (data: Record<string, unknown>) => {
        companyName.value = (data?.name as string) ?? null
        currentPrice.value = typeof data?.price === 'number' ? data.price : null
        closePrice.value = typeof data?.close === 'number' ? data.close : null
    }

    const loadChart = async () => {
        if (loading.value) return

        const sym = symbol.value.trim().toUpperCase()
        if (!sym) {
            error.value = 'Ingresa un símbolo válido.'
            return
        }

        loading.value = true
        error.value = null
        try {
            const res = await TradingAPI.getChartData(sym, timeframe.value, currentLimit.value)
            if (!res.success) {
                throw new Error(res.error ?? 'Error al obtener datos del gráfico')
            }

            const chartData = res.data as unknown as Record<string, unknown>
            if (!chartData || !chartData.bars || (chartData.bars as Bar[]).length === 0) {
                bars.value = []
                error.value = `No hay datos disponibles para ${sym}.`
                return
            }

            bars.value = chartData.bars as Bar[]
            if (chartData.quote) {
                applyQuoteData(chartData.quote as Record<string, unknown>)
            }

            currentSymbol.value = sym
            wsClient.subscribeToSymbol(sym)
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al cargar el gráfico'
        } finally {
            loading.value = false
        }
    }

    const handleQuoteUpdate = (data: unknown) => {
        const payload = data as { symbol?: string; price?: number }
        if (
            payload?.symbol?.toUpperCase() === currentSymbol.value &&
            typeof payload.price === 'number'
        ) {
            currentPrice.value = payload.price
        }
    }

    const handlePositionUpdate = (data: unknown) => {
        const payload = data as PositionData
        if (!payload || !payload.symbol) return
        if (payload.symbol.toUpperCase() === currentSymbol.value) {
            currentPosition.value = payload
        }
    }

    onMounted(() => {
        wsClient.subscribe('connected', () => {
            wsConnected.value = true
        })
        wsClient.subscribe('disconnected', () => {
            wsConnected.value = false
        })
        wsClient.subscribe('quote_update', handleQuoteUpdate)
        wsClient.subscribe('position_update', handlePositionUpdate)
        loadChart()
    })

    onUnmounted(() => {
        if (currentSymbol.value) {
            wsClient.unsubscribeFromSymbol(currentSymbol.value)
        }
        currentSymbol.value = null
        currentPosition.value = null
    })

    watch(
        () => route.query.symbol,
        (newVal) => {
            const sym = (newVal as string)?.trim()?.toUpperCase()
            if (sym && sym !== symbol.value.toUpperCase()) {
                symbol.value = sym
                loadChart()
            }
        }
    )

    watch(timeframe, loadChart)
    watch(rangeIndex, loadChart)

    return {
        symbol,
        timeframe,
        loading,
        error,
        bars,
        currentSymbol,
        currentPrice,
        closePrice,
        companyName,
        wsConnected,
        currentPosition,
        isFullscreen,
        drawingMode,
        opportunities,
        valuationRulesEnabled,
        valuationBaseSma,
        valuationOverPct,
        valuationUnderPct,
        effectiveOverPct,
        effectiveUnderPct,
        xTicksLimit,
        rangeIndex,
        currentMultiplier,
        currentLimit,
        tradeModalRef,
        tradeSymbol,
        tradePrice,
        tradeTimestamp,
        tradeQty,
        tradeSide,
        tradeOrderType,
        tradeSubmitting,
        tradeError,
        toastMessage,
        toastType,
        showToast,
        setDrawingMode,
        toggleFullscreen,
        openTradeModalForBar,
        closeTradeModal,
        submitTradeFromChart,
        applyQuoteData,
        loadChart,
        handleQuoteUpdate,
        handlePositionUpdate,
    }
}
