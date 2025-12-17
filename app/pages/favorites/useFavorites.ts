import type { MarketSymbolDocument, TrendAnalysisResult } from '~/composables/useApi'

export interface FavoriteRow {
    symbol: string
    name: string | null
    typeLabel: string
    price: number | null
    volume: number | null
    trades: number | null
    change: number | null
    percentChange: number | null
    direction: 'ganador' | 'perdedor' | 'plano' | null
}

const TREND_PREFS_KEY = 'trend_preferences'

export function useFavorites() {
    const router = useRouter()
    const { SymbolPreferencesAPI } = useApi()

    const loading = ref(false)
    const error = ref<string | null>(null)
    const favoritesError = ref<string | null>(null)
    const favorites = ref<string[]>([])
    const rows = ref<FavoriteRow[]>([])

    const updatingFavorites = ref(false)
    const newFavoriteSymbol = ref('')
    const refreshingFavorites = ref(false)

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

    // Trend modal
    const trendModalOpen = ref(false)
    const trendLoading = ref(false)
    const trendError = ref<string | null>(null)
    const trendResult = ref<TrendAnalysisResult | null>(null)
    const analyzingSymbol = ref<string | null>(null)

    const selectedProfile = ref<'intradia' | 'corto' | 'largo'>('corto')
    const selectedModel = ref<'xgboost' | 'random_forest'>('xgboost')

    const goToChart = (symbol: string) => {
        router.push({ path: '/chart', query: { symbol: symbol.toUpperCase() } })
    }

    const goToCompare = (symbol: string) => {
        router.push({ path: '/compare', query: { symbol: symbol.toUpperCase() } })
    }

    const deriveTypeLabel = (doc: MarketSymbolDocument | null | undefined): string => {
        if (!doc) return 'N/D'
        const market = (doc.market || '').toLowerCase()
        if (market === 'crypto') return 'Crypto'
        if (market === 'stocks') return 'Acción'
        return doc.market || 'Desconocido'
    }

    const mapMarketSymbolToRow = (doc: MarketSymbolDocument): FavoriteRow => {
        let direction: 'ganador' | 'perdedor' | 'plano' | null = null
        if (doc.change != null) {
            if (doc.change > 0) direction = 'ganador'
            else if (doc.change < 0) direction = 'perdedor'
            else direction = 'plano'
        } else if (doc.direction) {
            const dir = doc.direction.toLowerCase()
            if (dir === 'gainer') direction = 'ganador'
            else if (dir === 'loser') direction = 'perdedor'
            else direction = 'plano'
        }

        return {
            symbol: doc.symbol.toUpperCase(),
            name: doc.name ?? null,
            typeLabel: deriveTypeLabel(doc),
            price: doc.price,
            volume: doc.volume,
            trades: doc.trade_count,
            change: doc.change,
            percentChange: doc.percent_change,
            direction,
        }
    }

    const loadFavoritesTable = async () => {
        loading.value = true
        error.value = null
        favoritesError.value = null
        try {
            const favResp = await SymbolPreferencesAPI.getSymbols()
            if (!favResp.success) {
                const msg = favResp.error ?? 'Error al obtener favoritos'
                favoritesError.value = msg
                favorites.value = []
                rows.value = []
                showToast(msg, 'error')
                return
            }

            const symbols = (favResp.data || [])
                .map((s) => String(s).trim().toUpperCase())
                .filter(Boolean)
            favorites.value = symbols

            if (!symbols.length) {
                rows.value = []
                return
            }

            const detailsResp = await SymbolPreferencesAPI.getFavoriteDetails()
            if (!detailsResp.success) {
                const msg = detailsResp.error ?? 'Error al obtener detalles de favoritos'
                favoritesError.value = msg
                rows.value = []
                showToast(msg, 'error')
                return
            }

            rows.value = (detailsResp.data || []).map(mapMarketSymbolToRow)
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado'
            rows.value = []
        } finally {
            loading.value = false
        }
    }

    const addFavoriteFromInput = async () => {
        const raw = newFavoriteSymbol.value
        if (!raw) return
        const sym = raw.toString().trim().toUpperCase()
        if (!sym) return

        updatingFavorites.value = true
        favoritesError.value = null
        try {
            const resp = await SymbolPreferencesAPI.addSymbols({ symbol: sym })
            if (!resp.success) {
                const msg = resp.error ?? 'Error al agregar favorito'
                favoritesError.value = msg
                showToast(msg, 'error')
                return
            }

            newFavoriteSymbol.value = ''
            await loadFavoritesTable()
            showToast(`Símbolo ${sym} agregado a favoritos`, 'success')
        } catch (e) {
            const msg = (e as Error)?.message ?? 'Error inesperado al agregar favorito'
            favoritesError.value = msg
            showToast(msg, 'error')
        } finally {
            updatingFavorites.value = false
        }
    }

    const removeFavorite = async (symbol: string) => {
        const sym = symbol.toString().trim().toUpperCase()
        if (!sym) return

        updatingFavorites.value = true
        favoritesError.value = null
        try {
            const resp = await SymbolPreferencesAPI.removeSymbols({ symbol: sym })
            if (!resp.success) {
                const msg = resp.error ?? 'Error al quitar favorito'
                favoritesError.value = msg
                showToast(msg, 'error')
                return
            }

            await loadFavoritesTable()
            showToast(`Símbolo ${sym} quitado de favoritos`, 'success')
        } catch (e) {
            const msg = (e as Error)?.message ?? 'Error inesperado al quitar favorito'
            favoritesError.value = msg
            showToast(msg, 'error')
        } finally {
            updatingFavorites.value = false
        }
    }

    const refreshFavoritesFromAlpaca = async () => {
        refreshingFavorites.value = true
        favoritesError.value = null
        try {
            const resp = await SymbolPreferencesAPI.refreshFavorites()
            if (!resp.success) {
                const msg = resp.error ?? 'Error al actualizar favoritos'
                favoritesError.value = msg
                showToast(msg, 'error')
                return
            }

            rows.value = (resp.data || []).map(mapMarketSymbolToRow)
            showToast('Precios de favoritos actualizados.', 'success')
        } catch (e) {
            const msg = (e as Error)?.message ?? 'Error inesperado al actualizar favoritos'
            favoritesError.value = msg
            showToast(msg, 'error')
        } finally {
            refreshingFavorites.value = false
        }
    }

    const openTrendModal = async (symbol: string) => {
        trendModalOpen.value = true
        trendLoading.value = true
        trendError.value = null
        trendResult.value = null
        analyzingSymbol.value = symbol.toUpperCase()

        try {
            const resp = await SymbolPreferencesAPI.getFavoriteTrend({
                symbol: symbol.toUpperCase(),
                profile: selectedProfile.value,
                model_type: selectedModel.value,
            })
            if (!resp.success) {
                trendError.value = resp.error ?? 'Error al calcular tendencia'
                return
            }
            trendResult.value = resp.data
        } catch (e: unknown) {
            trendError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            trendLoading.value = false
        }
    }

    const closeTrendModal = () => {
        trendModalOpen.value = false
        trendError.value = null
        trendResult.value = null
        analyzingSymbol.value = null
    }

    const loadTrendPreferencesFromStorage = () => {
        if (!import.meta.client) return
        try {
            const stored = localStorage.getItem(TREND_PREFS_KEY)
            if (!stored) return
            const prefs = JSON.parse(stored)
            if (['intradia', 'corto', 'largo'].includes(prefs.profile)) {
                selectedProfile.value = prefs.profile
            }
            if (['xgboost', 'random_forest'].includes(prefs.model_type)) {
                selectedModel.value = prefs.model_type
            }
        } catch {
            /* ignore */
        }
    }

    const saveTrendPreferencesToStorage = () => {
        if (!import.meta.client) return
        try {
            localStorage.setItem(
                TREND_PREFS_KEY,
                JSON.stringify({
                    profile: selectedProfile.value,
                    model_type: selectedModel.value,
                })
            )
        } catch {
            /* ignore */
        }
    }

    watch(selectedProfile, saveTrendPreferencesToStorage)
    watch(selectedModel, saveTrendPreferencesToStorage)

    onMounted(() => {
        loadTrendPreferencesFromStorage()
        loadFavoritesTable()
    })

    return {
        loading,
        error,
        favoritesError,
        favorites,
        rows,
        updatingFavorites,
        newFavoriteSymbol,
        refreshingFavorites,
        trendModalOpen,
        trendLoading,
        trendError,
        trendResult,
        analyzingSymbol,
        selectedProfile,
        selectedModel,
        goToChart,
        goToCompare,
        deriveTypeLabel,
        mapMarketSymbolToRow,
        loadFavoritesTable,
        addFavoriteFromInput,
        removeFavorite,
        refreshFavoritesFromAlpaca,
        openTrendModal,
        closeTrendModal,
        loadTrendPreferencesFromStorage,
        saveTrendPreferencesToStorage,
        toastMessage,
        toastType,
    }
}
