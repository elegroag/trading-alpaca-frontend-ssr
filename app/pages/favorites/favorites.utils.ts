export const formatPrice = (value: number | null): string =>
    value != null ? value.toFixed(2) : '-'

export const formatInt = (value: number | null): string =>
    value != null ? value.toLocaleString('es-ES') : '-'

export const formatChange = (value: number | null): string =>
    value != null ? value.toFixed(2) : '-'

export const formatPercent = (value: number | null): string =>
    value != null ? `${value.toFixed(2)} %` : '-'
