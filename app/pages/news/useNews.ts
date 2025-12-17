import type { NewsItem, Position } from '~/composables/useApi'

export function useNews() {
    const { TradingAPI, NewsAPI } = useApi()

    const route = useRoute()

    const loadingPositions = ref(false)
    const loadingNews = ref(false)
    const error = ref<string | null>(null)

    const positions = ref<Position[]>([])
    const selectedSymbol = ref<string>('')

    const news = ref<NewsItem[]>([])
    const limit = ref(10)

    const sortedPositions = computed(() => {
        return [...positions.value].sort(
            (a, b) => (b.unrealized_pl ?? 0) - (a.unrealized_pl ?? 0),
        )
    })

    const loadPositions = async () => {
        loadingPositions.value = true
        error.value = null
        try {
            const resp = await TradingAPI.getPositions()
            if (!resp.success) {
                error.value = resp.error ?? 'Error al obtener posiciones'
                positions.value = []
                return
            }
            positions.value = resp.data || []

            const querySymbol = (route.query.symbol as string | undefined)?.trim().toUpperCase()
            if (querySymbol) {
                selectedSymbol.value = querySymbol
            }

            if (!selectedSymbol.value && positions.value.length > 0) {
                const best = sortedPositions.value[0]
                selectedSymbol.value = (best?.symbol || '').toUpperCase()
            }
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al obtener posiciones'
            positions.value = []
        } finally {
            loadingPositions.value = false
        }
    }

    const loadNews = async () => {
        const sym = (selectedSymbol.value || '').trim().toUpperCase()
        if (!sym) {
            news.value = []
            return
        }

        loadingNews.value = true
        error.value = null
        try {
            const resp = await NewsAPI.getNews(sym, { limit: limit.value })
            if (!resp.success) {
                error.value = resp.error ?? 'Error al obtener noticias'
                news.value = []
                return
            }
            news.value = resp.data || []
        } catch (e: unknown) {
            error.value = (e as Error)?.message ?? 'Error inesperado al obtener noticias'
            news.value = []
        } finally {
            loadingNews.value = false
        }
    }

    const refresh = async () => {
        await loadPositions()
        await loadNews()
    }

    onMounted(async () => {
        await loadPositions()
        await loadNews()
    })

    watch(
        () => route.query.symbol,
        async () => {
            const querySymbol = (route.query.symbol as string | undefined)?.trim().toUpperCase()
            if (querySymbol && querySymbol !== selectedSymbol.value) {
                selectedSymbol.value = querySymbol
            }
        },
    )

    watch(
        () => selectedSymbol.value,
        async () => {
            await loadNews()
        },
    )

    return {
        loadingPositions,
        loadingNews,
        error,
        positions,
        sortedPositions,
        selectedSymbol,
        news,
        limit,
        loadPositions,
        loadNews,
        refresh,
    }
}
