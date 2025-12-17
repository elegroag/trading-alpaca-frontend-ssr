export const formatMultiCompareLabel = (iso: string, tf: string) => {
    const date = new Date(iso)

    if (tf.includes('Min') || tf.includes('H')) {
        return date.toLocaleString('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
    }

    return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
