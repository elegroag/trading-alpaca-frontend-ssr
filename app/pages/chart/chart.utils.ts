export const timeframes = [
    { value: '1D', label: '1 Día' },
    { value: '1H', label: '1 Hora' },
    { value: '15Min', label: '15 Min' },
    { value: '5Min', label: '5 Min' },
    { value: '1Min', label: '1 Min' },
]

export const xTickOptions = [
    { value: 6, label: 'Pocas' },
    { value: 10, label: 'Medias' },
    { value: 16, label: 'Muchas' },
    { value: 20, label: 'Máximo' },
]

export const rangeSteps = [10, 20, 30, 40, 50, 100]

export type PriceChartValuationBaseSma = 'sma20' | 'sma50'

export interface PriceChartOpportunity {
    index: number
    timestamp: string
    price: number
    type: 'overvalued' | 'undervalued'
}

export const formatPrice = (value: number | null | undefined): string => {
    if (typeof value !== 'number') return '-'
    return `$${value.toFixed(2)}`
}

export const formatPercent = (value: number | null | undefined): string => {
    if (typeof value !== 'number') return '-'
    return `${value.toFixed(2)}%`
}
