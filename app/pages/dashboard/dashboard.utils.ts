export const defaultCurrencyFormatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}

export const formatCurrency = (
    value: number | null | undefined,
    locale = 'en-US',
): string => {
    if (typeof value !== 'number') {
        return ''
    }

    return value.toLocaleString(locale, {
        style: 'currency',
        currency: 'USD',
        ...defaultCurrencyFormatOptions,
    })
}
