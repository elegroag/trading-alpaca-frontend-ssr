export const formatPrice = (value: number | null | undefined): string => {
    if (typeof value !== 'number') return '-'
    return `$${value.toFixed(2)}`
}

export const formatVolume = (value: number | null | undefined): string => {
    if (typeof value !== 'number') return '-'
    return value.toLocaleString('es-ES')
}

export const formatPercent = (value: number | null | undefined): string => {
    if (typeof value !== 'number') return '-'
    return `${value.toFixed(2)}%`
}
