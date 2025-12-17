export interface MultiCompareSymbolDetail {
    name: string | null
    price: number | null
    volume: number | null
    perfPct: number | null
}

export function useMultiCompare() {
    const maxSymbols = 6
    const symbols = ref<string[]>(['AAPL'])
    const newSymbol = ref('')
    const loading = ref(false)
    const error = ref<string | null>(null)
    const symbolDetails = ref<Record<string, MultiCompareSymbolDetail>>({})

    const enrichedSymbols = computed(() =>
        symbols.value.map((sym) => {
            const key = sym.trim().toUpperCase()
            return {
                symbol: key,
                detail: symbolDetails.value[key] ?? null,
            }
        })
    )

    return {
        maxSymbols,
        symbols,
        newSymbol,
        loading,
        error,
        symbolDetails,
        enrichedSymbols,
    }
}
