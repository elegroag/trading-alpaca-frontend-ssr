import type { MarketSymbolDocument } from '~/composables/useApi'

export function useMarketSymbols() {
    const { ScreenerAPI } = useApi()

    const loading = ref(false)
    const error = ref<string | null>(null)
    const symbols = ref<MarketSymbolDocument[]>([])

    const search = ref('')
    const marketFilter = ref<'all' | 'stocks' | 'crypto'>('all')
    const directionFilter = ref<'all' | 'gainer' | 'loser'>('all')
    const minPriceFilter = ref<number | null>(null)
    const maxPriceFilter = ref<number | null>(null)
    const minPctFilter = ref<number | null>(null)
    const maxPctFilter = ref<number | null>(null)

    const page = ref(1)
    const pageSize = ref(15)
    const pageSizeOptions = [15, 25, 50, 100, 200]

    const filteredSymbols = computed(() => {
        let list = symbols.value

        const q = search.value.trim().toUpperCase()
        if (q) {
            list = list.filter((s) => {
                const sym = (s.symbol || '').toUpperCase()
                const name = (s.name || '').toUpperCase()
                return sym.includes(q) || name.includes(q)
            })
        }

        if (marketFilter.value !== 'all') {
            list = list.filter((s) => (s.market || '').toLowerCase() === marketFilter.value)
        }

        if (directionFilter.value !== 'all') {
            list = list.filter((s) => (s.direction || '').toLowerCase() === directionFilter.value)
        }

        if (minPriceFilter.value != null || maxPriceFilter.value != null) {
            list = list.filter((s) => {
                const p = s.price
                if (p == null) return false
                if (minPriceFilter.value != null && p < minPriceFilter.value) return false
                if (maxPriceFilter.value != null && p > maxPriceFilter.value) return false
                return true
            })
        }

        if (minPctFilter.value != null || maxPctFilter.value != null) {
            list = list.filter((s) => {
                const pc = s.percent_change
                if (pc == null) return false
                if (minPctFilter.value != null && pc < minPctFilter.value) return false
                if (maxPctFilter.value != null && pc > maxPctFilter.value) return false
                return true
            })
        }

        return list
    })

    const totalItems = computed(() => filteredSymbols.value.length)

    const totalPages = computed(() => {
        if (!totalItems.value || pageSize.value <= 0) return 1
        return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
    })

    const paginatedSymbols = computed(() => {
        const start = (page.value - 1) * pageSize.value
        const end = start + pageSize.value
        return filteredSymbols.value.slice(start, end)
    })

    const goToPage = (newPage: number) => {
        if (newPage < 1) newPage = 1
        const max = totalPages.value
        if (newPage > max) newPage = max
        page.value = newPage
    }

    watch(
        () => [
            search.value,
            marketFilter.value,
            directionFilter.value,
            minPriceFilter.value,
            maxPriceFilter.value,
            minPctFilter.value,
            maxPctFilter.value,
            pageSize.value,
        ],
        () => {
            page.value = 1
        },
    )

    const loadSymbols = async () => {
        loading.value = true
        error.value = null
        try {
            const resp = await ScreenerAPI.getMarketSymbols({ limit: 1000 })
            if (!resp.success) {
                error.value = resp.error ?? 'Error al obtener símbolos de mercado'
                symbols.value = []
                return
            }
            symbols.value = resp.data || []
            page.value = 1
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al obtener símbolos de mercado'
            symbols.value = []
        } finally {
            loading.value = false
        }
    }

    onMounted(loadSymbols)

    return {
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
        filteredSymbols,
        totalItems,
        totalPages,
        paginatedSymbols,
        goToPage,
        loadSymbols,
    }
}
