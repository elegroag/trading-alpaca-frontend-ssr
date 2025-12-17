import type { MostActiveItem, MarketMoversData } from '~/composables/useApi'

export function useScreener() {
    const router = useRouter()
    const { TradingAPI, SymbolPreferencesAPI } = useApi()

    const loading = ref(false)
    const error = ref<string | null>(null)

    const mode = ref<'most-actives' | 'movers'>('most-actives')
    const market = ref<'stocks' | 'crypto'>('stocks')
    const by = ref<'volume' | 'trades'>('volume')
    const limit = ref(10)
    const minPrice = ref<number | null>(null)
    const maxPrice = ref<number | null>(null)

    const mostActives = ref<MostActiveItem[]>([])
    const movers = ref<MarketMoversData | null>(null)

    const favorites = ref<string[]>([])
    const loadingFavorites = ref(false)
    const updatingFavorites = ref(false)
    const newFavoriteSymbol = ref('')
    const showOnlyFavorites = ref(false)
    const favoritesError = ref<string | null>(null)

    const isStocks = computed(() => market.value === 'stocks')
    const favoriteSet = computed(() => new Set(favorites.value.map((s) => s.toUpperCase())))

    const isFavorite = (symbol: string | null | undefined): boolean => {
        if (!symbol) return false
        return favoriteSet.value.has(symbol.toUpperCase())
    }

    const filteredMostActives = computed(() => {
        let list = mostActives.value
        if (showOnlyFavorites.value && favorites.value.length) {
            list = list.filter((item) => isFavorite(item.symbol))
        }
        return list
    })

    const filteredGainers = computed(() => {
        let list = movers.value?.gainers || []
        if (showOnlyFavorites.value && favorites.value.length) {
            list = list.filter((item) => isFavorite(item.symbol))
        }
        return list
    })

    const filteredLosers = computed(() => {
        let list = movers.value?.losers || []
        if (showOnlyFavorites.value && favorites.value.length) {
            list = list.filter((item) => isFavorite(item.symbol))
        }
        return list
    })

    const goToChart = (symbol: string | null | undefined) => {
        if (!symbol) return
        router.push({ path: '/chart', query: { symbol: symbol.toUpperCase() } })
    }

    const toggleFavorite = async (symbol: string | null | undefined) => {
        if (!symbol) return
        const sym = symbol.toUpperCase()

        updatingFavorites.value = true
        try {
            let resp
            if (isFavorite(sym)) {
                resp = await SymbolPreferencesAPI.removeSymbols({ symbol: sym })
            } else {
                resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
            }

            if (resp.success) {
                favorites.value = resp.data || []
            }
        } catch (e) {
            console.error('Error actualizando favoritos', e)
        } finally {
            updatingFavorites.value = false
        }
    }

    const addFavoriteFromInput = async () => {
        const sym = newFavoriteSymbol.value.trim().toUpperCase()
        if (!sym) return

        updatingFavorites.value = true
        try {
            const resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
            if (resp.success) {
                favorites.value = resp.data || []
                newFavoriteSymbol.value = ''
            }
        } catch (e) {
            console.error('Error agregando favorito', e)
        } finally {
            updatingFavorites.value = false
        }
    }

    const loadData = async () => {
        loading.value = true
        error.value = null
        try {
            if (mode.value === 'most-actives') {
                const resp = await TradingAPI.getMostActives({
                    by: by.value,
                    limit: limit.value,
                    market: market.value,
                    minPrice: minPrice.value,
                    maxPrice: maxPrice.value,
                })
                if (!resp.success) {
                    error.value = resp.error ?? 'Error al obtener most actives'
                    mostActives.value = []
                    return
                }
                mostActives.value = resp.data
                movers.value = null
            } else {
                const resp = await TradingAPI.getMarketMovers({
                    limit: limit.value,
                    market: market.value,
                    minPrice: minPrice.value,
                    maxPrice: maxPrice.value,
                })
                if (!resp.success) {
                    error.value = resp.error ?? 'Error al obtener market movers'
                    movers.value = null
                    return
                }
                movers.value = resp.data
                mostActives.value = []
            }
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al cargar screener'
            mostActives.value = []
            movers.value = null
        } finally {
            loading.value = false
        }
    }

    const loadFavorites = async () => {
        loadingFavorites.value = true
        try {
            const resp = await SymbolPreferencesAPI.getSymbols()
            if (resp.success) {
                favorites.value = resp.data || []
            }
        } catch (e) {
            console.error('Error cargando favoritos', e)
        } finally {
            loadingFavorites.value = false
        }
    }

    onMounted(() => {
        loadData()
        loadFavorites()
    })

    return {
        loading,
        error,
        mode,
        market,
        by,
        limit,
        minPrice,
        maxPrice,
        mostActives,
        movers,
        favorites,
        loadingFavorites,
        updatingFavorites,
        newFavoriteSymbol,
        showOnlyFavorites,
        favoritesError,
        isStocks,
        favoriteSet,
        filteredMostActives,
        filteredGainers,
        filteredLosers,
        isFavorite,
        goToChart,
        toggleFavorite,
        addFavoriteFromInput,
        loadData,
        loadFavorites,
    }
}
