import type { Account } from '~/composables/useApi'

export function useDashboard() {
    const { TradingAPI, ScreenerAPI } = useApi()

    const loading = ref(false)
    const error = ref<string | null>(null)
    const account = ref<Account | null>(null)
    const ordersListRef = ref<{ loadOrders: () => void } | null>(null)

    const syncingSymbols = ref(false)
    const syncMessage = ref<string | null>(null)
    const syncError = ref<string | null>(null)

    const handleOrderCreated = () => {
        if (ordersListRef.value && typeof ordersListRef.value.loadOrders === 'function') {
            ordersListRef.value.loadOrders()
        }
    }

    const syncMarketSymbols = async () => {
        syncingSymbols.value = true
        syncMessage.value = null
        syncError.value = null
        try {
            const resp = await ScreenerAPI.syncSymbols({
                topMostActives: 50,
                topMovers: 50,
                market: 'stocks',
            })
            if (!resp.success) {
                syncError.value = resp.error ?? 'Error al sincronizar símbolos de mercado'
                return
            }
            const count = resp.data?.processed ?? 0
            syncMessage.value = `Se sincronizaron ${count} símbolos de mercado.`
        } catch (e: unknown) {
            syncError.value =
                (e as Error)?.message ?? 'Error inesperado al sincronizar símbolos de mercado'
        } finally {
            syncingSymbols.value = false
        }
    }

    const loadAccount = async () => {
        loading.value = true
        error.value = null
        try {
            const response = await TradingAPI.getAccount()
            if (response.success) {
                account.value = response.data
            } else {
                error.value = response.error ?? 'Error al obtener cuenta'
            }
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al obtener cuenta'
        } finally {
            loading.value = false
        }
    }

    onMounted(() => {
        loadAccount()
    })

    return {
        loading,
        error,
        account,
        ordersListRef,
        syncingSymbols,
        syncMessage,
        syncError,
        handleOrderCreated,
        syncMarketSymbols,
        loadAccount,
    }
}
