const TREND_PREFS_KEY = 'trend_preferences'

export function useProfile() {
    const { AuthAPI, SymbolPreferencesAPI } = useApi()
    const { user } = useAuthState()

    const loadingProfile = ref(false)
    const profileError = ref<string | null>(null)

    const alpacaApiKey = ref('')
    const alpacaSecretKey = ref('')
    const alpacaBaseUrl = ref('')
    const paperTrading = ref(true)

    const saving = ref(false)
    const saveError = ref<string | null>(null)
    const saveSuccess = ref<string | null>(null)

    const favorites = ref<string[]>([])
    const loadingFavorites = ref(false)
    const favoritesError = ref<string | null>(null)
    const updatingFavorites = ref(false)
    const newSymbol = ref('')

    // Preferencias de tendencia
    const selectedProfile = ref<'intradia' | 'corto' | 'largo'>('corto')
    const selectedModel = ref<'xgboost' | 'random_forest'>('xgboost')
    const trendPrefsSaved = ref(false)

    const loadProfile = async () => {
        loadingProfile.value = true
        profileError.value = null
        try {
            const response = await AuthAPI.me()
            if (!response.success) {
                profileError.value = response.error ?? 'Error al obtener perfil'
                return
            }
            const u = response.data
            user.value = u

            if (import.meta.client) {
                const serialized = JSON.stringify(u)
                sessionStorage.setItem('auth_user', serialized)
                localStorage.setItem('auth_user', serialized)
            }

            alpacaBaseUrl.value = u.alpaca_base_url || ''
            paperTrading.value = u.paper_trading
        } catch (e: unknown) {
            profileError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            loadingProfile.value = false
        }
    }

    const handleSubmit = async () => {
        saving.value = true
        saveError.value = null
        saveSuccess.value = null
        try {
            const payload: Record<string, unknown> = {
                paper_trading: paperTrading.value,
                alpaca_base_url: alpacaBaseUrl.value.trim() || undefined,
            }

            if (alpacaApiKey.value.trim()) {
                payload.alpaca_api_key = alpacaApiKey.value.trim()
            }
            if (alpacaSecretKey.value.trim()) {
                payload.alpaca_secret_key = alpacaSecretKey.value.trim()
            }

            const response = await AuthAPI.updateKeys(payload as any)
            if (!response.success) {
                saveError.value = response.error ?? 'Error al actualizar claves'
                return
            }

            const updated = response.data
            user.value = updated

            if (import.meta.client) {
                const serialized = JSON.stringify(updated)
                sessionStorage.setItem('auth_user', serialized)
                localStorage.setItem('auth_user', serialized)
            }

            saveSuccess.value = 'Claves Alpaca actualizadas correctamente'
            alpacaApiKey.value = ''
            alpacaSecretKey.value = ''
        } catch (e: unknown) {
            saveError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            saving.value = false
        }
    }

    const loadFavorites = async () => {
        loadingFavorites.value = true
        favoritesError.value = null
        try {
            const response = await SymbolPreferencesAPI.getSymbols()
            if (!response.success) {
                favoritesError.value = response.error ?? 'Error al obtener favoritos'
                return
            }
            favorites.value = response.data || []
        } catch (e: unknown) {
            favoritesError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            loadingFavorites.value = false
        }
    }

    const addFavorite = async () => {
        const raw = newSymbol.value.trim().toUpperCase()
        if (!raw) return
        if (favorites.value.includes(raw)) {
            newSymbol.value = ''
            return
        }

        updatingFavorites.value = true
        favoritesError.value = null
        try {
            const response = await SymbolPreferencesAPI.addSymbols({ symbol: raw })
            if (!response.success) {
                favoritesError.value = response.error ?? 'Error al agregar símbolo'
                return
            }
            favorites.value = response.data || []
            newSymbol.value = ''
        } catch (e: unknown) {
            favoritesError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            updatingFavorites.value = false
        }
    }

    const removeFavorite = async (symbol: string) => {
        updatingFavorites.value = true
        favoritesError.value = null
        try {
            const response = await SymbolPreferencesAPI.removeSymbols({ symbol })
            if (!response.success) {
                favoritesError.value = response.error ?? 'Error al eliminar símbolo'
                return
            }
            favorites.value = response.data || []
        } catch (e: unknown) {
            favoritesError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            updatingFavorites.value = false
        }
    }

    const clearFavorites = async () => {
        updatingFavorites.value = true
        favoritesError.value = null
        try {
            const response = await SymbolPreferencesAPI.removeSymbols()
            if (!response.success) {
                favoritesError.value = response.error ?? 'Error al limpiar favoritos'
                return
            }
            favorites.value = response.data || []
        } catch (e: unknown) {
            favoritesError.value = (e as Error)?.message ?? 'Error inesperado'
        } finally {
            updatingFavorites.value = false
        }
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
            trendPrefsSaved.value = true
            setTimeout(() => {
                trendPrefsSaved.value = false
            }, 1500)
        } catch {
            /* ignore */
        }
    }

    watch(selectedProfile, saveTrendPreferencesToStorage)
    watch(selectedModel, saveTrendPreferencesToStorage)

    onMounted(() => {
        loadProfile()
        loadFavorites()
        loadTrendPreferencesFromStorage()
    })

    return {
        user,
        loadingProfile,
        profileError,
        alpacaApiKey,
        alpacaSecretKey,
        alpacaBaseUrl,
        paperTrading,
        saving,
        saveError,
        saveSuccess,
        favorites,
        loadingFavorites,
        favoritesError,
        updatingFavorites,
        newSymbol,
        selectedProfile,
        selectedModel,
        trendPrefsSaved,
        loadProfile,
        handleSubmit,
        loadFavorites,
        addFavorite,
        removeFavorite,
        clearFavorites,
        loadTrendPreferencesFromStorage,
        saveTrendPreferencesToStorage,
    }
}
